import "server-only";

import { ActionPolicyDecision, AutopilotActionState, AutopilotMode, MonthlyAutopilotStatus, PlanPublishingMode } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { getCustomPublishingConfig, getCustomPublishingWebhookUrl } from "@/lib/publishing/custom-webhook-config";
import { deliverCustomFixWebhook } from "@/lib/publishing/custom-webhook";
import { resolveLivePublishScope } from "@/lib/integrations/live-publish-rollout";
import { canExecuteActionAutomatically } from "./action-policy";
import { safeLogError, safeLogInfo } from "@/lib/logging";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function runDueSafeActions(input: { websiteId: string; now?: Date; limit?: number }) {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const website = await prisma.website.findFirst({
    where: { id: input.websiteId, deletedAt: null },
    select: {
      id: true,
      organizationId: true,
      livePublishRolloutEnabled: true,
      autopilotLivePublishPaused: true,
      monthlyAutopilotPlans: {
        where: { status: MonthlyAutopilotStatus.APPROVED, publishingMode: PlanPublishingMode.AUTO_PUBLISH, archivedAt: null },
        orderBy: { approvedAt: "desc" },
        take: 1,
        select: { userId: true, approvedAt: true },
      },
    },
  });
  const plan = website?.monthlyAutopilotPlans[0];
  if (!website || !plan || website.autopilotLivePublishPaused) return { attempted: 0, applied: 0, failed: 0 };
  const [state, config] = await Promise.all([
    prisma.websiteUserState.findUnique({
      where: { userId_websiteId: { userId: plan.userId, websiteId: website.id } },
      select: { autopilotMode: true },
    }),
    getCustomPublishingConfig(website.id),
  ]);
  const rollout = resolveLivePublishScope({ websiteId: website.id, dbRolloutEnabled: website.livePublishRolloutEnabled });
  if (state?.autopilotMode !== AutopilotMode.AUTOPUBLISH || !rollout.allowed || !config?.autoSendEnabled || !config.testedAt) {
    return { attempted: 0, applied: 0, failed: 0 };
  }
  const endpointUrl = await getCustomPublishingWebhookUrl(website.id);
  if (!endpointUrl) return { attempted: 0, applied: 0, failed: 0 };

  const actions = await prisma.autopilotAction.findMany({
    where: {
      websiteId: website.id,
      actionType: "INTERNAL_LINKS",
      policy: ActionPolicyDecision.SAFE_AUTO,
      state: { in: [AutopilotActionState.PLANNED, AutopilotActionState.SCHEDULED] },
      scheduledAt: { lte: now },
    },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    take: Math.min(Math.max(input.limit ?? 10, 1), 25),
  });
  let applied = 0;
  let failed = 0;
  for (const action of actions) {
    if (!canExecuteActionAutomatically({ mode: "AUTO", policy: action.policy })) continue;
    const evidence = record(action.evidenceJson);
    const targetUrl = typeof evidence.targetUrl === "string" ? evidence.targetUrl : null;
    const anchor = typeof evidence.anchor === "string" ? evidence.anchor : null;
    if (!action.targetUrl || !targetUrl || !anchor) continue;
    await prisma.autopilotAction.update({
      where: { id: action.id },
      data: { state: AutopilotActionState.PUBLISHING, startedAt: now, attemptCount: { increment: 1 }, approvedAt: action.approvedAt ?? plan.approvedAt ?? now },
    });
    const startedAt = Date.now();
    try {
      const result = await deliverCustomFixWebhook({
        taskId: action.id,
        websiteId: website.id,
        organizationId: website.organizationId,
        endpointUrl,
        dryRun: false,
        fix: {
          id: action.id,
          type: "SEO_FIX",
          field: "internal_links",
          title: action.title,
          preview: `Add a contextual link from ${action.targetUrl} to ${targetUrl}.`,
          suggestedValue: JSON.stringify({ operation: "ADD_INTERNAL_LINK", sourceUrl: action.targetUrl, targetUrl, anchor }),
          summary: action.reason,
          implementationNotes: "Insert one contextual link in relevant visible body copy. Preserve existing content and anchors.",
          riskLevel: "low",
        },
      });
      if (!result.delivered || result.applied !== true) throw new Error(result.error ?? "Target did not confirm application.");
      await prisma.autopilotAction.update({
        where: { id: action.id },
        data: { state: AutopilotActionState.PUBLISHED, publishedAt: now, completedAt: now, publishedUrl: action.targetUrl, externalId: result.externalId ?? null, lastError: null },
      });
      applied += 1;
      safeLogInfo("autopilot.action", "Safe action applied", {
        siteId: website.id,
        actionId: action.id,
        jobId: null,
        integrationId: config.integrationId,
        type: action.actionType,
        status: "PUBLISHED",
        durationMs: Date.now() - startedAt,
        error: null,
      });
    } catch (error) {
      const attempts = action.attemptCount + 1;
      await prisma.autopilotAction.update({
        where: { id: action.id },
        data: {
          state: attempts >= 5 ? AutopilotActionState.FAILED : AutopilotActionState.SCHEDULED,
          scheduledAt: attempts >= 5 ? action.scheduledAt : new Date(now.getTime() + Math.min(2 ** attempts, 24) * 60 * 60 * 1000),
          lastError: error instanceof Error ? error.message.slice(0, 500) : "Safe action delivery failed.",
        },
      });
      failed += 1;
      safeLogError("autopilot.action", error, {
        siteId: website.id,
        actionId: action.id,
        jobId: null,
        integrationId: config.integrationId,
        type: action.actionType,
        status: attempts >= 5 ? "FAILED" : "SCHEDULED",
        durationMs: Date.now() - startedAt,
      });
    }
  }
  return { attempted: actions.length, applied, failed };
}
