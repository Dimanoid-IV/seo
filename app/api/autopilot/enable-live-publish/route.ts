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
import { getAutopilotSettings } from "@/lib/autopilot/autopilot-settings";
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
      planApprovedForAutoPublish:
        Boolean(plan) && settings.mode === AutopilotMode.AUTOPUBLISH,
      publishingIntegrationConnected:
        wordpressConnected || customPublishingConnected,
      livePublishPaused: settings.livePublishPaused,
    });

    if (!decision.allowed) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        reasonMessages[decision.reason]
      );
    }

    if (customPublishingConnected) {
      await setCustomPublishingAutoSend({
        websiteId: website.id,
        enabled: true,
      });
    }

    await prisma.website.update({
      where: { id: website.id },
      data: { livePublishRolloutEnabled: true },
    });

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

