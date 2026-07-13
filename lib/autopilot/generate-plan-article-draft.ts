import "server-only";

import type { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { resolveWebsiteForAutopilot } from "@/lib/autopilot/resolve-website";
import {
  planItemsToJson,
  resolvePlanItemsDocumentFromPlan,
} from "@/lib/autopilot/plan-items";
import { parseContentResearchBrief } from "@/lib/content-research/parse";
import {
  generateArticleFromResearchBrief,
  type GenerateArticleFromResearchResult,
} from "@/lib/articles/generate-from-research";
import {
  isWordPressConnectedForWebsite,
  serializeArticleRecord,
} from "@/lib/articles/article-serialize";
import { RESEARCH_QUALITY_PASS_THRESHOLD } from "@/lib/articles/research-generation-types";

export type GeneratePlanArticleDraftResult = GenerateArticleFromResearchResult & {
  planItem: {
    id: string;
    status: string;
    generatedArticleId: string;
    articleQualityScore: number;
    articleQualityPassed: boolean;
    reviewQueueHref: string;
  };
};

/**
 * Generates an article draft from an autopilot plan item's research brief.
 * Links the plan item to the article and marks it prepared for review.
 * Does not publish externally.
 */
export async function generatePlanItemArticleDraft(input: {
  planId: string;
  planItemId: string;
  userId: string;
  organizationId: string | null;
}): Promise<GeneratePlanArticleDraftResult> {
  const prisma = getPrisma();

  const plan = await prisma.monthlyAutopilotPlan.findFirst({
    where: {
      id: input.planId,
      userId: input.userId,
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

  const document = resolvePlanItemsDocumentFromPlan({
    planItemsJson: plan.planItemsJson,
    recommendationsJson: plan.recommendationsJson,
    taskIds: plan.taskIds,
    articleIds: plan.articleIds,
    socialPostIds: plan.socialPostIds,
  });

  if (!document) {
    throw new AppError(ErrorCode.NOT_FOUND, "Plan items not found.");
  }

  const itemIndex = document.items.findIndex((i) => i.id === input.planItemId);
  if (itemIndex === -1) {
    throw new AppError(ErrorCode.NOT_FOUND, "Plan item not found.");
  }

  const item = document.items[itemIndex]!;

  if (item.type !== "ARTICLE") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Article drafts can only be generated for ARTICLE plan items."
    );
  }

  if (!item.researchBrief) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Research brief missing. Refresh research before generating a draft."
    );
  }

  const brief = parseContentResearchBrief(item.researchBrief);
  if (!brief) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Research brief is invalid. Refresh research first."
    );
  }

  const allowedStatuses = [
    "approved",
    "scheduled",
    "prepared",
    "proposed",
  ] as const;

  if (!allowedStatuses.includes(item.status as (typeof allowedStatuses)[number])) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "This plan item cannot generate a draft in its current status."
    );
  }

  if (item.generatedArticleId) {
    const existingArticle = await prisma.article.findFirst({
      where: {
        id: item.generatedArticleId,
        websiteId: plan.websiteId,
        organizationId: plan.organizationId,
        deletedAt: null,
      },
    });

    if (existingArticle) {
      const wordpressConnected = await isWordPressConnectedForWebsite(
        plan.websiteId
      );
      const reviewQueueHref = `/app/review`;
      const serialized = serializeArticleRecord(
        existingArticle,
        wordpressConnected
      );

      return {
        article: serialized,
        qualityReport: {
          score: existingArticle.qualityScore ?? item.articleQualityScore ?? 0,
          passed:
            existingArticle.qualityPassed ?? item.articleQualityPassed ?? false,
          checks: [],
          revisionNotes: [],
          validatedAt: existingArticle.updatedAt.toISOString(),
          threshold: RESEARCH_QUALITY_PASS_THRESHOLD,
        },
        planItemId: item.id,
        planItem: {
          id: item.id,
          status: item.status,
          generatedArticleId: existingArticle.id,
          articleQualityScore:
            existingArticle.qualityScore ?? item.articleQualityScore ?? 0,
          articleQualityPassed:
            existingArticle.qualityPassed ?? item.articleQualityPassed ?? false,
          reviewQueueHref,
        },
      };
    }
  }

  const result = await generateArticleFromResearchBrief({
    websiteId: plan.websiteId,
    organizationId: plan.organizationId,
    userId: input.userId,
    researchBrief: brief,
    monthlyAutopilotPlanId: plan.id,
    planItemId: item.id,
  });

  const reviewQueueHref = `/app/review`;

  const updatedItems = [...document.items];
  updatedItems[itemIndex] = {
    ...item,
    status: "prepared",
    sourceRef: { type: "article", id: result.article.id },
    generatedArticleId: result.article.id,
    articleQualityScore: result.qualityReport.score,
    articleQualityPassed: result.qualityReport.passed,
    reviewQueueHref,
    blockedReasonKey: result.qualityReport.passed
      ? undefined
      : "articleNeedsRevision",
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
    ...result,
    planItem: {
      id: item.id,
      status: "prepared",
      generatedArticleId: result.article.id,
      articleQualityScore: result.qualityReport.score,
      articleQualityPassed: result.qualityReport.passed,
      reviewQueueHref,
    },
  };
}
