import "server-only";

import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import {
  parsePlanItemsDocument,
  planItemsToJson,
} from "./plan-items";

export async function markArticlePublishedInMonthlyPlans(input: {
  articleId: string;
  websiteId: string;
  publishedAt?: Date;
  publishingPath: "webhook" | "wordpress_live" | "universal_package";
}): Promise<{ updatedPlans: number; updatedItems: number }> {
  const prisma = getPrisma();
  const plans = await prisma.monthlyAutopilotPlan.findMany({
    where: {
      websiteId: input.websiteId,
      archivedAt: null,
      planItemsJson: { not: Prisma.JsonNull },
    },
    select: {
      id: true,
      planItemsJson: true,
    },
  });

  const publishedAtIso = (input.publishedAt ?? new Date()).toISOString();
  let updatedPlans = 0;
  let updatedItems = 0;

  for (const plan of plans) {
    const document = parsePlanItemsDocument(plan.planItemsJson);
    if (!document) continue;

    let changed = false;
    const items = document.items.map((item) => {
      if (item.generatedArticleId !== input.articleId) {
        return item;
      }

      changed = true;
      updatedItems += 1;

      if (input.publishingPath === "webhook") {
        return {
          ...item,
          status: "published" as const,
          pipelineState: "WEBHOOK_VERIFIED_LIVE" as const,
          publishingPath: "webhook" as const,
          webhookReadyAt: item.webhookReadyAt ?? publishedAtIso,
          webhookSentAt: item.webhookSentAt ?? publishedAtIso,
          nextAutomatedStep: "monitor_performance",
          reviewQueueHref: undefined,
          articleQualityPassed: item.articleQualityPassed ?? true,
        };
      }

      if (input.publishingPath === "wordpress_live") {
        return {
          ...item,
          status: "published" as const,
          pipelineState: "WORDPRESS_LIVE_PUBLISHED" as const,
          publishingPath: "wordpress_live" as const,
          nextAutomatedStep: "monitor_performance",
          reviewQueueHref: undefined,
          articleQualityPassed: item.articleQualityPassed ?? true,
        };
      }

      return {
        ...item,
        status: "prepared" as const,
        pipelineState: "UNIVERSAL_PACKAGE_READY" as const,
        publishingPath: "universal_package" as const,
        universalPackagePreparedAt: item.universalPackagePreparedAt ?? publishedAtIso,
        nextAutomatedStep: "copy_or_send_package",
        reviewQueueHref: "/app/review",
      };
    });

    if (!changed) continue;

    await prisma.monthlyAutopilotPlan.update({
      where: { id: plan.id },
      data: {
        planItemsJson: planItemsToJson({
          ...document,
          items,
        }),
      },
    });
    updatedPlans += 1;
  }

  return { updatedPlans, updatedItems };
}

export async function markArticlePublicationFailedInMonthlyPlans(input: {
  articleId: string;
  websiteId: string;
  reasonKey: string;
}): Promise<{ updatedPlans: number; updatedItems: number }> {
  const prisma = getPrisma();
  const plans = await prisma.monthlyAutopilotPlan.findMany({
    where: {
      websiteId: input.websiteId,
      archivedAt: null,
      planItemsJson: { not: Prisma.JsonNull },
    },
    select: { id: true, planItemsJson: true },
  });

  let updatedPlans = 0;
  let updatedItems = 0;
  for (const plan of plans) {
    const document = parsePlanItemsDocument(plan.planItemsJson);
    if (!document) continue;
    let changed = false;
    const items = document.items.map((item) => {
      if (item.generatedArticleId !== input.articleId) return item;
      changed = true;
      updatedItems += 1;
      return {
        ...item,
        status: "blocked" as const,
        pipelineState: "FAILED" as const,
        blockedReasonKey: input.reasonKey,
        nextAutomatedStep: "retry_failed_publication",
        reviewQueueHref: "/app/review",
      };
    });
    if (!changed) continue;
    await prisma.monthlyAutopilotPlan.update({
      where: { id: plan.id },
      data: {
        planItemsJson: planItemsToJson({ ...document, items }),
      },
    });
    updatedPlans += 1;
  }

  return { updatedPlans, updatedItems };
}
