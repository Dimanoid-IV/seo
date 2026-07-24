import "server-only";

import {
  AutopilotMode,
  IntegrationProvider,
  IntegrationStatus,
  MonthlyAutopilotStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";

import { getAutopilotSettings, autopilotModeToClient } from "./autopilot-settings";
import { currentMonthKey } from "./month-utils";
import {
  countPlanItemsByStatus,
  enrichPlanItemsFromEntities,
  findNextScheduledItem,
  parsePlanItemsDocument,
} from "./plan-items";
import type { AutopilotPlanItem } from "./plan-item-types";
import { resolveWebsiteForAutopilot } from "./resolve-website";

export type AutopilotPlanApprovalStatus =
  | "none"
  | "draft"
  | "ready"
  | "partial"
  | "approved";

export type AutopilotBlockedReasonKey =
  | "wordpressNotConnected"
  | "noApprovedItems"
  | "planLimitReached"
  | "needsReviewQueueApproval"
  | "gscNotConnected"
  | "planNotApproved"
  | "autopilotOff";

export type AutopilotStatusSnapshot = {
  mode: string;
  modeRaw: AutopilotMode;
  nextScheduledItem: {
    id: string;
    title: string;
    scheduledFor: string;
    type: string;
  } | null;
  planApprovalStatus: AutopilotPlanApprovalStatus;
  blockedReasonKeys: AutopilotBlockedReasonKey[];
  approvedItemsCount: number;
  scheduledItemsCount: number;
  proposedItemsCount: number;
  planId: string | null;
  planMonth: string | null;
  itemsApprovedAt: string | null;
};

export function hasArticleAwaitingPublishingIntegration(
  items: Pick<
    AutopilotPlanItem,
    "type" | "status" | "generatedArticleId" | "articleQualityPassed"
  >[]
): boolean {
  return items.some(
    (item) =>
      item.type === "ARTICLE" &&
      Boolean(item.generatedArticleId) &&
      item.articleQualityPassed !== false &&
      !["executed", "published", "skipped"].includes(item.status)
  );
}

export function publishingIntegrationReady(input: {
  wordpressConnected: boolean;
  customPublishingConnected: boolean;
}): boolean {
  return input.wordpressConnected || input.customPublishingConnected;
}

export async function getAutopilotStatusSnapshot(input: {
  currentUser: CurrentUser;
  websiteId?: string | null;
}): Promise<AutopilotStatusSnapshot> {
  const month = currentMonthKey();
  const settings = await getAutopilotSettings({
    userId: input.currentUser.id,
    organizationId: input.currentUser.organizationId,
    websiteId: input.websiteId,
  });

  let websiteId = settings.websiteId;

  try {
    const resolved = await resolveWebsiteForAutopilot(
      input.currentUser.id,
      input.currentUser.organizationId,
      websiteId
    );
    websiteId = resolved.website.id;
  } catch {
    return emptySnapshot(settings.mode);
  }

  const prisma = getPrisma();

  const [plan, gscIntegration, wpConnection, customPublishing, tasks] = await Promise.all([
    prisma.monthlyAutopilotPlan.findUnique({
      where: {
        websiteId_month: { websiteId, month },
      },
      select: {
        id: true,
        month: true,
        status: true,
        planItemsJson: true,
        approvedAt: true,
      },
    }),
    prisma.integration.findFirst({
      where: {
        websiteId,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
      select: { status: true },
    }),
    prisma.wordPressConnection.findFirst({
      where: { websiteId },
      select: { status: true },
    }),
    getCustomPublishingConfig(websiteId),
    prisma.task.findMany({
      where: { websiteId, deletedAt: null },
      select: { id: true, recommendationJson: true, status: true },
      take: 50,
    }),
  ]);

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const customPublishingConnected = Boolean(
    customPublishing?.endpointConfigured && customPublishing.testedAt
  );
  const gscConnected = gscIntegration?.status === IntegrationStatus.CONNECTED;

  const parsedDoc = plan?.planItemsJson
    ? parsePlanItemsDocument(plan.planItemsJson)
    : null;

  const document = parsedDoc
    ? enrichPlanItemsFromEntities({
        document: parsedDoc,
        tasks,
        wordpressConnected,
      })
    : null;

  const items = document?.items ?? [];
  const counts = countPlanItemsByStatus(items);
  const nextItem = findNextScheduledItem(items);

  const blockedReasonKeys: AutopilotBlockedReasonKey[] = [];

  if (settings.mode === AutopilotMode.OFF) {
    blockedReasonKeys.push("autopilotOff");
  }

  const articleAwaitingPublishing = hasArticleAwaitingPublishingIntegration(items);

  if (
    articleAwaitingPublishing &&
    !publishingIntegrationReady({
      wordpressConnected,
      customPublishingConnected,
    })
  ) {
    blockedReasonKeys.push("wordpressNotConnected");
  }

  if (!gscConnected) {
    blockedReasonKeys.push("gscNotConnected");
  }

  const approvedOrScheduled =
    counts.approved + counts.scheduled + counts.prepared + counts.executed;

  if (settings.mode === AutopilotMode.APPROVED_PLAN_AUTOPILOT) {
    if (approvedOrScheduled === 0) {
      blockedReasonKeys.push("noApprovedItems");
    }
    if (
      plan &&
      plan.status !== MonthlyAutopilotStatus.APPROVED &&
      !document?.itemsApprovedAt
    ) {
      blockedReasonKeys.push("planNotApproved");
    }
  }

  if (settings.mode === AutopilotMode.REVIEW_FIRST && counts.prepared > 0) {
    blockedReasonKeys.push("needsReviewQueueApproval");
  }

  let planApprovalStatus: AutopilotPlanApprovalStatus = "none";
  if (plan) {
    if (
      plan.status === MonthlyAutopilotStatus.APPROVED ||
      document?.itemsApprovedAt
    ) {
      planApprovalStatus = counts.proposed > 0 ? "partial" : "approved";
    } else if (plan.status === MonthlyAutopilotStatus.READY) {
      planApprovalStatus = "ready";
    } else {
      planApprovalStatus = "draft";
    }
  }

  return {
    mode: autopilotModeToClient(settings.mode),
    modeRaw: settings.mode,
    nextScheduledItem: nextItem?.scheduledFor
      ? {
          id: nextItem.id,
          title: nextItem.title,
          scheduledFor: nextItem.scheduledFor,
          type: nextItem.type,
        }
      : null,
    planApprovalStatus,
    blockedReasonKeys,
    approvedItemsCount: approvedOrScheduled,
    scheduledItemsCount: counts.scheduled + counts.prepared,
    proposedItemsCount: counts.proposed,
    planId: plan?.id ?? null,
    planMonth: plan?.month ?? month,
    itemsApprovedAt:
      document?.itemsApprovedAt ?? plan?.approvedAt?.toISOString() ?? null,
  };
}

function emptySnapshot(mode: AutopilotMode): AutopilotStatusSnapshot {
  return {
    mode: autopilotModeToClient(mode),
    modeRaw: mode,
    nextScheduledItem: null,
    planApprovalStatus: "none",
    blockedReasonKeys: mode === AutopilotMode.OFF ? ["autopilotOff"] : [],
    approvedItemsCount: 0,
    scheduledItemsCount: 0,
    proposedItemsCount: 0,
    planId: null,
    planMonth: null,
    itemsApprovedAt: null,
  };
}
