import "server-only";

import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { resolveWebsiteForAutopilot } from "@/lib/autopilot/resolve-website";
import {
  parsePlanItemsDocument,
  planItemsToJson,
} from "@/lib/autopilot/plan-items";
import type { AutopilotFocusArea } from "@/lib/autopilot/types";
import { briefToJson } from "@/lib/content-research/parse";
import { refreshPlanItemResearchBrief } from "@/lib/content-research/plan-integration";
import { toResearchBriefSummary } from "@/lib/content-research/types";

export async function refreshAutopilotPlanItemResearchBrief(input: {
  planId: string;
  itemId: string;
  userId: string;
  organizationId: string | null;
}) {
  const prisma = getPrisma();

  const plan = await prisma.monthlyAutopilotPlan.findFirst({
    where: {
      id: input.planId,
      archivedAt: null,
    },
  });

  if (!plan) {
    throw new AppError(ErrorCode.NOT_FOUND, "Monthly autopilot plan not found.");
  }

  const { organization } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    plan.websiteId
  );

  if (plan.organizationId !== organization.id) {
    throw new AppError(ErrorCode.FORBIDDEN, "Plan access denied.");
  }

  const document = plan.planItemsJson
    ? parsePlanItemsDocument(plan.planItemsJson)
    : null;

  if (!document) {
    throw new AppError(ErrorCode.NOT_FOUND, "Plan items not found.");
  }

  const itemIndex = document.items.findIndex((i) => i.id === input.itemId);
  if (itemIndex === -1) {
    throw new AppError(ErrorCode.NOT_FOUND, "Plan item not found.");
  }

  const item = document.items[itemIndex]!;

  if (item.type !== "ARTICLE") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Research briefs are only available for article plan items."
    );
  }

  const focusAreas = Array.isArray(plan.focusAreasJson)
    ? (plan.focusAreasJson as AutopilotFocusArea[])
    : [];

  const brief = await refreshPlanItemResearchBrief({
    item,
    websiteId: plan.websiteId,
    organizationId: plan.organizationId,
    userId: input.userId,
    focusAreaTitles: focusAreas.map((a) => a.title),
  });

  const updatedItems = [...document.items];
  updatedItems[itemIndex] = {
    ...item,
    researchBrief: briefToJson(brief),
  };

  await prisma.monthlyAutopilotPlan.update({
    where: { id: plan.id },
    data: {
      planItemsJson: planItemsToJson({
        ...document,
        items: updatedItems,
      }) as Prisma.InputJsonValue,
    },
  });

  return {
    brief,
    summary: toResearchBriefSummary(brief),
    planItemId: item.id,
  };
}
