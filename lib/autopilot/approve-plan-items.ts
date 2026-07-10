import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  MonthlyAutopilotStatus,
  type Prisma,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { timelineAfterMonthlyAutopilotPlanApproved } from "./hooks";
import {
  buildPlanItemsFromRecommendedActions,
  enrichPlanItemsFromEntities,
  parsePlanItemsDocument,
  planItemsToJson,
} from "./plan-items";
import type { AutopilotRecommendedAction } from "./types";
import type { AutopilotPlanPeriod } from "./plan-item-types";
import { findAutopilotPlanForUser } from "./resolve-website";
import { assignEveryOtherDaySlots } from "./scheduling";
import { formatMonthlyAutopilotPlan } from "./format";

export async function approveSelectedPlanItems(input: {
  planId: string;
  userId: string;
  itemIds: string[];
  period?: AutopilotPlanPeriod;
  timezone?: string | null;
}) {
  if (input.itemIds.length === 0) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Select at least one plan item.");
  }

  const existing = await findAutopilotPlanForUser(input.planId, input.userId);

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Monthly plan not found");
  }

  const prisma = getPrisma();

  const [gscIntegration, wpConnection, tasks] = await Promise.all([
    prisma.integration.findFirst({
      where: {
        websiteId: existing.websiteId,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
      select: { status: true },
    }),
    prisma.wordPressConnection.findFirst({
      where: { websiteId: existing.websiteId },
      select: { status: true },
    }),
    prisma.task.findMany({
      where: { websiteId: existing.websiteId, deletedAt: null },
      select: { id: true, recommendationJson: true },
      take: 50,
    }),
  ]);

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const gscConnected = gscIntegration?.status === IntegrationStatus.CONNECTED;

  let document = existing.planItemsJson
    ? parsePlanItemsDocument(existing.planItemsJson)
    : null;

  if (!document || document.items.length === 0) {
    const recommendedActions = Array.isArray(existing.recommendationsJson)
      ? (existing.recommendationsJson as AutopilotRecommendedAction[])
      : [];
    if (recommendedActions.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        "This plan has no approvable items yet. Regenerate the plan first."
      );
    }
    document = buildPlanItemsFromRecommendedActions({
      recommendedActions,
      taskIds: existing.taskIds,
      articleIds: existing.articleIds,
      socialPostIds: existing.socialPostIds,
    });
  }

  if (!document || document.items.length === 0) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This plan has no approvable items yet. Regenerate the plan first."
    );
  }

  if (input.period) {
    document = { ...document, period: input.period };
  }

  const selectedIds = new Set(input.itemIds);

  let items = document.items.map((item) => {
    if (!selectedIds.has(item.id)) {
      return item;
    }

    if (item.status === "skipped" || item.status === "executed") {
      return item;
    }

    let status: typeof item.status = "approved";
    let blockedReasonKey = item.blockedReasonKey;

    if (item.type === "ARTICLE" && !wordpressConnected) {
      status = "blocked";
      blockedReasonKey = "wordpressNotConnected";
    } else if (item.needsIntegration && item.integrationType === "gsc" && !gscConnected) {
      status = "blocked";
      blockedReasonKey = "gscNotConnected";
    }

    return {
      ...item,
      status,
      blockedReasonKey,
      selected: undefined,
    };
  });

  const approvedIds = new Set(
    items
      .filter(
        (item) =>
          selectedIds.has(item.id) &&
          item.status !== "blocked" &&
          item.status !== "skipped"
      )
      .map((item) => item.id)
  );

  items = assignEveryOtherDaySlots({
    items,
    approvedItemIds: approvedIds,
    timezone: input.timezone,
  });

  document = enrichPlanItemsFromEntities({
    document: { ...document, items, itemsApprovedAt: new Date().toISOString() },
    tasks,
    wordpressConnected,
  });

  const wasApproved = existing.status !== MonthlyAutopilotStatus.APPROVED;

  const updated = await prisma.monthlyAutopilotPlan.update({
    where: { id: existing.id },
    data: {
      planItemsJson: planItemsToJson(document),
      status: MonthlyAutopilotStatus.APPROVED,
      approvedAt: existing.approvedAt ?? new Date(),
    },
  });

  if (wasApproved) {
    try {
      await timelineAfterMonthlyAutopilotPlanApproved({
        userId: input.userId,
        websiteId: existing.websiteId,
        planId: existing.id,
        month: existing.month,
      });
    } catch {
      // Timeline must not block approval.
    }
  }

  return {
    plan: formatMonthlyAutopilotPlan(updated),
    planItems: document,
    approvedCount: approvedIds.size,
    blockedCount: items.filter(
      (item) => selectedIds.has(item.id) && item.status === "blocked"
    ).length,
  };
}

export async function updatePlanItemSelection(input: {
  planId: string;
  userId: string;
  itemIds: string[];
  selected: boolean;
}) {
  const existing = await findAutopilotPlanForUser(input.planId, input.userId);

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Monthly plan not found");
  }

  const document = existing.planItemsJson
    ? parsePlanItemsDocument(existing.planItemsJson)
    : null;

  if (!document) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Plan items not found");
  }

  const idSet = new Set(input.itemIds);
  const items = document.items.map((item) => {
    if (!idSet.has(item.id) && input.itemIds.length > 0) {
      return item;
    }
    if (input.itemIds.length === 0) {
      return { ...item, selected: input.selected };
    }
    return { ...item, selected: input.selected };
  });

  const prisma = getPrisma();
  await prisma.monthlyAutopilotPlan.update({
    where: { id: existing.id },
    data: {
      planItemsJson: planItemsToJson({ ...document, items }) as Prisma.InputJsonValue,
    },
  });

  return { ...document, items };
}
