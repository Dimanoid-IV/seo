import "server-only";

import { AutopilotMode } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { resolveWebsiteForAutopilot } from "./resolve-website";

export type AutopilotSettingsView = {
  mode: AutopilotMode;
  websiteId: string;
  autopublishAvailable: boolean;
  livePublishPaused: boolean;
  livePublishPausedAt: string | null;
  livePublishPauseReason: string | null;
  /** DB-backed first-customer scoped live publish (Prompt 11.55). */
  livePublishRolloutEnabled: boolean;
};

const CLIENT_MODE_MAP: Record<AutopilotMode, string> = {
  OFF: "off",
  REVIEW_FIRST: "review_first",
  APPROVED_PLAN_AUTOPILOT: "approved_plan_autopilot",
  AUTOPUBLISH: "autopublish",
};

export function autopilotModeToClient(mode: AutopilotMode): string {
  return CLIENT_MODE_MAP[mode];
}

export function parseAutopilotModeFromClient(
  value: string
): AutopilotMode | null {
  switch (value) {
    case "off":
    case "OFF":
      return AutopilotMode.OFF;
    case "review_first":
    case "REVIEW_FIRST":
      return AutopilotMode.REVIEW_FIRST;
    case "approved_plan_autopilot":
    case "APPROVED_PLAN_AUTOPILOT":
      return AutopilotMode.APPROVED_PLAN_AUTOPILOT;
    case "autopublish":
    case "AUTOPUBLISH":
      return AutopilotMode.AUTOPUBLISH;
    default:
      return null;
  }
}

export async function getAutopilotSettings(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
}): Promise<AutopilotSettingsView> {
  const { website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  const prisma = getPrisma();

  try {
    const [state, websitePause] = await Promise.all([
      prisma.websiteUserState.upsert({
        where: {
          userId_websiteId: {
            userId: input.userId,
            websiteId: website.id,
          },
        },
        create: {
          userId: input.userId,
          websiteId: website.id,
          autopilotMode: AutopilotMode.REVIEW_FIRST,
        },
        update: {},
        select: { autopilotMode: true },
      }),
      prisma.website.findFirst({
        where: { id: website.id },
        select: {
          autopilotLivePublishPaused: true,
          autopilotLivePublishPausedAt: true,
          autopilotLivePublishPauseReason: true,
          livePublishRolloutEnabled: true,
        },
      }),
    ]);

    return {
      mode: state.autopilotMode,
      websiteId: website.id,
      autopublishAvailable: false,
      livePublishPaused: websitePause?.autopilotLivePublishPaused === true,
      livePublishPausedAt:
        websitePause?.autopilotLivePublishPausedAt?.toISOString() ?? null,
      livePublishPauseReason:
        websitePause?.autopilotLivePublishPauseReason ?? null,
      livePublishRolloutEnabled:
        websitePause?.livePublishRolloutEnabled === true,
    };
  } catch {
    return {
      mode: AutopilotMode.REVIEW_FIRST,
      websiteId: website.id,
      autopublishAvailable: false,
      livePublishPaused: false,
      livePublishPausedAt: null,
      livePublishPauseReason: null,
      livePublishRolloutEnabled: false,
    };
  }
}

export async function updateAutopilotSettings(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
  mode: AutopilotMode;
  /**
   * AUTOPUBLISH is only allowed from explicit monthly-plan confirmation
   * (Prompt 11.50) — never from silent settings toggles.
   */
  source?: "plan_approval" | "settings_ui";
}): Promise<AutopilotSettingsView> {
  if (
    input.mode === AutopilotMode.AUTOPUBLISH &&
    input.source !== "plan_approval"
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Autopublish can only be enabled when confirming a monthly plan."
    );
  }

  const { website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  const prisma = getPrisma();

  const [state, websitePause] = await Promise.all([
    prisma.websiteUserState.upsert({
      where: {
        userId_websiteId: {
          userId: input.userId,
          websiteId: website.id,
        },
      },
      create: {
        userId: input.userId,
        websiteId: website.id,
        autopilotMode: input.mode,
      },
      update: {
        autopilotMode: input.mode,
      },
      select: { autopilotMode: true },
    }),
    prisma.website.findFirst({
      where: { id: website.id },
      select: {
        autopilotLivePublishPaused: true,
        autopilotLivePublishPausedAt: true,
        autopilotLivePublishPauseReason: true,
        livePublishRolloutEnabled: true,
      },
    }),
  ]);

  return {
    mode: state.autopilotMode,
    websiteId: website.id,
    /** Settings UI must not offer silent autopublish — only plan confirm. */
    autopublishAvailable: false,
    livePublishPaused: websitePause?.autopilotLivePublishPaused === true,
    livePublishPausedAt:
      websitePause?.autopilotLivePublishPausedAt?.toISOString() ?? null,
    livePublishPauseReason:
      websitePause?.autopilotLivePublishPauseReason ?? null,
    livePublishRolloutEnabled:
      websitePause?.livePublishRolloutEnabled === true,
  };
}
