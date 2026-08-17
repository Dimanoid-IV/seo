import {
  AutopilotMode,
  MonthlyAutopilotStatus,
  PlanPublishingMode,
  WordPressConnectionStatus,
} from "@prisma/client";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import {
  getAutopilotSettings,
  updateAutopilotSettings,
} from "@/lib/autopilot/autopilot-settings";
import { evaluateLivePublishActivationPrerequisites } from "@/lib/autopilot/live-publish-activation-policy";
import { resolveWebsiteForAutopilot } from "@/lib/autopilot/resolve-website";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  getCustomPublishingConfig,
  setCustomPublishingAutoSend,
} from "@/lib/publishing/custom-webhook-config";

const bodySchema = z.object({
  websiteId: z.string().uuid(),
});

const reasonMessages = {
  plan_not_approved_for_auto_publish:
    "Confirm the monthly plan with automatic publishing first.",
  publishing_integration_not_connected:
    "Connect and test WordPress or a custom publishing endpoint first.",
  live_publish_paused: "Resume live publishing before enabling Autopilot.",
} as const;

export async function POST(request: Request) {
  try {
    const currentUser = await requireUser(request);
    const parsed = bodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) throw validationErrorFromZod(parsed.error);

    const { organization, website } = await resolveWebsiteForAutopilot(
      currentUser.id,
      currentUser.organizationId,
      parsed.data.websiteId
    );
    const prisma = getPrisma();

    const [plan, settings, wordpress, customPublishing] = await Promise.all([
      prisma.monthlyAutopilotPlan.findFirst({
        where: {
          userId: currentUser.id,
          organizationId: organization.id,
          websiteId: website.id,
          archivedAt: null,
          status: MonthlyAutopilotStatus.APPROVED,
          publishingMode: PlanPublishingMode.AUTO_PUBLISH,
        },
        orderBy: [{ month: "desc" }, { updatedAt: "desc" }],
        select: { id: true },
      }),
      getAutopilotSettings({
        userId: currentUser.id,
        organizationId: organization.id,
        websiteId: website.id,
      }),
      prisma.wordPressConnection.findFirst({
        where: { websiteId: website.id },
        select: { status: true },
      }),
      getCustomPublishingConfig(website.id),
    ]);

    const wordpressConnected =
      wordpress?.status === WordPressConnectionStatus.CONNECTED;
    const customPublishingConnected = Boolean(
      customPublishing?.endpointConfigured && customPublishing.testedAt
    );
    const decision = evaluateLivePublishActivationPrerequisites({
      // The approved AUTO_PUBLISH plan plus this explicit POST are the user
      // consent. Requiring the mode to already be AUTOPUBLISH made activation
      // impossible after a state-sync failure or an earlier mode change.
      planApprovedForAutoPublish: Boolean(plan),
      publishingIntegrationConnected:
        wordpressConnected || customPublishingConnected,
      livePublishPaused: settings.livePublishPaused,
      currentMode: settings.mode,
    });

    if (!decision.allowed) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        reasonMessages[decision.reason]
      );
    }

    await updateAutopilotSettings({
      userId: currentUser.id,
      organizationId: organization.id,
      websiteId: website.id,
      mode: AutopilotMode.AUTOPUBLISH,
      source: "explicit_live_publish_enable",
    });

    // Enable the website gate before the provider-specific switch. If the
    // provider update fails, its fail-closed autoSend flag still prevents a
    // delivery and a retry can safely finish activation.
    await prisma.website.update({
      where: { id: website.id },
      data: { livePublishRolloutEnabled: true },
    });

    if (customPublishingConnected) {
      await setCustomPublishingAutoSend({
        websiteId: website.id,
        enabled: true,
      });
    }

    return authJsonResponse({
      data: {
        websiteId: website.id,
        livePublishRolloutEnabled: true,
        wordpressConnected,
        customPublishingConnected,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
