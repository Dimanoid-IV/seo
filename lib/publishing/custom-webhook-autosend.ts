import "server-only";

import {
  AutopilotMode,
  MonthlyAutopilotStatus,
  PlanPublishingMode,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { getAutopilotSettings } from "@/lib/autopilot/autopilot-settings";

import { canEnableCustomWebhookAutoSend } from "./custom-webhook-autosend-policy";

export async function shouldEnableCustomWebhookAutoSendForCurrentPlan(input: {
  userId: string;
  organizationId: string;
  websiteId: string;
}): Promise<boolean> {
  const prisma = getPrisma();
  const [plan, settings] = await Promise.all([
    prisma.monthlyAutopilotPlan.findFirst({
      where: {
        userId: input.userId,
        organizationId: input.organizationId,
        websiteId: input.websiteId,
        archivedAt: null,
        status: MonthlyAutopilotStatus.APPROVED,
        publishingMode: PlanPublishingMode.AUTO_PUBLISH,
      },
      orderBy: [{ month: "desc" }, { updatedAt: "desc" }],
      select: { id: true },
    }),
    getAutopilotSettings({
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId,
    }),
  ]);

  return canEnableCustomWebhookAutoSend({
    hasApprovedAutoPublishPlan: Boolean(plan),
    autopilotMode: settings.mode ?? AutopilotMode.REVIEW_FIRST,
  });
}

export async function shouldEnableCustomWebhookAutoSendFailClosed(input: {
  userId: string;
  organizationId: string;
  websiteId: string;
}): Promise<boolean> {
  try {
    return await shouldEnableCustomWebhookAutoSendForCurrentPlan(input);
  } catch {
    return false;
  }
}
