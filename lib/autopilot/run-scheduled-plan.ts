import "server-only";

import {
  ActivityType,
  AutopilotMode,
  MonthlyAutopilotStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { createWordPressDraftForArticle } from "@/lib/integrations/wordpress-drafts";

import {
  classifyDryRunOutcome,
  findDuePlanItems,
  resolvePlanItemExecutionEligibility,
  type ExecutionActionType,
  type ExecutionReasonKey,
} from "./execution-eligibility";
import { generatePlanItemArticleDraft } from "./generate-plan-article-draft";
import { timelineAfterAutopilotPlanItemExecuted } from "./hooks";
import {
  parsePlanItemsDocument,
  planItemsToJson,
  reconcileArticleDraftSchedulingBlocks,
  repairApprovedPlanItemsDocument,
  resolvePlanItemsDocumentFromPlan,
} from "./plan-items";
import type { AutopilotPlanItem } from "./plan-item-types";
import { getAutopilotSettings } from "./autopilot-settings";
import { resolveWebsiteForAutopilot } from "./resolve-website";

export type PlanItemRunResult = {
  planId: string;
  planItemId: string;
  itemTitle: string;
  action: ExecutionActionType;
  reasonKey: ExecutionReasonKey;
  summaryKey?: string;
  eligible: boolean;
  executed: boolean;
  dryRun: boolean;
  error?: string;
  nextStatus?: AutopilotPlanItem["status"];
};

export type RunScheduledAutopilotReport = {
  dryRun: boolean;
  plansScanned: number;
  dueItemsFound: number;
  executedCount: number;
  skippedCount: number;
  blockedCount: number;
  errorCount: number;
  results: PlanItemRunResult[];
};

async function loadLinkedArticle(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
}) {
  const prisma = getPrisma();
  return prisma.article.findFirst({
    where: {
      id: input.articleId,
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      qualityPassed: true,
      websiteId: true,
      organizationId: true,
      wordpressPostId: true,
    },
  });
}

function applyPlanItemUpdate(
  items: AutopilotPlanItem[],
  itemId: string,
  patch: Partial<AutopilotPlanItem>
): AutopilotPlanItem[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
}

export async function runScheduledAutopilotPlans(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
  dryRun?: boolean;
  now?: Date;
}): Promise<RunScheduledAutopilotReport> {
  const now = input.now ?? new Date();
  const dryRun = input.dryRun ?? false;
  const prisma = getPrisma();

  const { organization, website } = await resolveWebsiteForAutopilot(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  const settings = await getAutopilotSettings({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
  });

  const report: RunScheduledAutopilotReport = {
    dryRun,
    plansScanned: 0,
    dueItemsFound: 0,
    executedCount: 0,
    skippedCount: 0,
    blockedCount: 0,
    errorCount: 0,
    results: [],
  };

  if (settings.mode === AutopilotMode.OFF) {
    return report;
  }

  const [plans, wpConnection] = await Promise.all([
    prisma.monthlyAutopilotPlan.findMany({
      where: {
        userId: input.userId,
        organizationId: organization.id,
        websiteId: website.id,
        archivedAt: null,
        status: MonthlyAutopilotStatus.APPROVED,
      },
      orderBy: { month: "desc" },
    }),
    prisma.wordPressConnection.findFirst({
      where: { websiteId: website.id },
      select: { status: true },
    }),
  ]);

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;

  report.plansScanned = plans.length;

  for (const plan of plans) {
    let document = resolvePlanItemsDocumentFromPlan(plan);

    if (!document?.items.length) {
      continue;
    }

    const hadPersistedItems = Boolean(
      plan.planItemsJson && parsePlanItemsDocument(plan.planItemsJson)?.items.length
    );

    if (!hadPersistedItems && plan.status === MonthlyAutopilotStatus.APPROVED) {
      document = repairApprovedPlanItemsDocument({
        document,
        planStatus: plan.status,
        approvedAt: plan.approvedAt,
      });
    }

    const reconciled = reconcileArticleDraftSchedulingBlocks({
      document,
      approvedAt: plan.approvedAt,
    });

    if (reconciled !== document) {
      document = reconciled;
      if (!dryRun) {
        await prisma.monthlyAutopilotPlan.update({
          where: { id: plan.id },
          data: { planItemsJson: planItemsToJson(document) },
        });
      }
    } else if (!hadPersistedItems && plan.status === MonthlyAutopilotStatus.APPROVED) {
      if (!dryRun) {
        await prisma.monthlyAutopilotPlan.update({
          where: { id: plan.id },
          data: { planItemsJson: planItemsToJson(document) },
        });
      }
    }

    const dueItems = findDuePlanItems(document.items, now);
    report.dueItemsFound += dueItems.length;

    let items = document.items;
    let planDirty = false;

    for (const dueItem of dueItems) {
      const itemResult: PlanItemRunResult = {
        planId: plan.id,
        planItemId: dueItem.id,
        itemTitle: dueItem.title,
        action: "SKIP",
        reasonKey: "notDueYet",
        eligible: false,
        executed: false,
        dryRun,
      };

      try {
        const currentItem = items.find((i) => i.id === dueItem.id) ?? dueItem;

        const article = currentItem.generatedArticleId
          ? await loadLinkedArticle({
              articleId: currentItem.generatedArticleId,
              websiteId: plan.websiteId,
              organizationId: plan.organizationId,
            })
          : null;

        const eligibility = resolvePlanItemExecutionEligibility({
          item: currentItem,
          now,
          autopilotMode: settings.mode,
          wordpressConnected,
          websiteId: plan.websiteId,
          organizationId: plan.organizationId,
          article,
        });

        itemResult.action = eligibility.action;
        itemResult.reasonKey = eligibility.reasonKey;
        itemResult.summaryKey = eligibility.summaryKey;
        itemResult.eligible = eligibility.eligible;
        itemResult.nextStatus = eligibility.suggestedStatus;

        if (!eligibility.eligible) {
          if (eligibility.action === "BLOCKED" && eligibility.persistBlocked) {
            report.blockedCount += 1;
            if (!dryRun) {
              items = applyPlanItemUpdate(items, currentItem.id, {
                status: "blocked",
                blockedReasonKey: eligibility.reasonKey,
              });
              planDirty = true;
            }
          } else {
            report.skippedCount += 1;
          }

          report.results.push(itemResult);
          continue;
        }

        if (dryRun) {
          // Mirror the real-run classification so preview counts stay honest:
          // no-op internal items (non-article TASK_FIX/SEO_FIX) do nothing and
          // must be reported as skipped rather than "will run".
          const outcome = classifyDryRunOutcome(eligibility);
          itemResult.executed = false;
          if (outcome === "wouldRun") {
            report.executedCount += 1;
          } else {
            report.skippedCount += 1;
            itemResult.eligible = false;
            itemResult.action = "SKIP";
          }
          report.results.push(itemResult);
          continue;
        }

        if (eligibility.action === "PREPARE_ARTICLE_DRAFT") {
          const draftResult = await generatePlanItemArticleDraft({
            planId: plan.id,
            planItemId: currentItem.id,
            userId: input.userId,
            organizationId: organization.id,
          });

          items = applyPlanItemUpdate(items, currentItem.id, {
            status: "prepared",
            generatedArticleId: draftResult.planItem.generatedArticleId,
            articleQualityScore: draftResult.planItem.articleQualityScore,
            articleQualityPassed: draftResult.planItem.articleQualityPassed,
            reviewQueueHref: draftResult.planItem.reviewQueueHref,
            blockedReasonKey: draftResult.planItem.articleQualityPassed
              ? undefined
              : "articleNeedsRevision",
            sourceRef: {
              type: "article",
              id: draftResult.planItem.generatedArticleId,
            },
          });
          planDirty = true;
          itemResult.executed = true;
          itemResult.nextStatus = "prepared";
          report.executedCount += 1;

          try {
            await timelineAfterAutopilotPlanItemExecuted({
              userId: input.userId,
              websiteId: plan.websiteId,
              planId: plan.id,
              planItemId: currentItem.id,
              action: "PREPARE_ARTICLE_DRAFT",
              itemTitle: currentItem.title,
            });
          } catch {
            // Timeline must not block execution.
          }
        } else if (eligibility.action === "PUBLISH_APPROVED_ARTICLE") {
          if (!currentItem.generatedArticleId) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              "Generated article missing for publish step."
            );
          }

          await createWordPressDraftForArticle({
            articleId: currentItem.generatedArticleId,
            userId: input.userId,
          });

          items = applyPlanItemUpdate(items, currentItem.id, {
            status: "executed",
            blockedReasonKey: undefined,
          });
          planDirty = true;
          itemResult.executed = true;
          itemResult.nextStatus = "executed";
          report.executedCount += 1;

          try {
            await timelineAfterAutopilotPlanItemExecuted({
              userId: input.userId,
              websiteId: plan.websiteId,
              planId: plan.id,
              planItemId: currentItem.id,
              action: "PUBLISH_APPROVED_ARTICLE",
              itemTitle: currentItem.title,
            });
          } catch {
            // Timeline must not block execution.
          }
        } else if (eligibility.action === "NOOP_INTERNAL") {
          if (eligibility.suggestedStatus === "executed") {
            items = applyPlanItemUpdate(items, currentItem.id, {
              status: "executed",
              blockedReasonKey: undefined,
            });
            planDirty = true;
            itemResult.executed = true;
            itemResult.nextStatus = "executed";
            report.executedCount += 1;
          } else {
            report.skippedCount += 1;
          }
        }

        report.results.push(itemResult);
      } catch (error) {
        report.errorCount += 1;
        itemResult.error =
          error instanceof AppError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unknown execution error";
        report.results.push(itemResult);

        if (!dryRun) {
          try {
            await prisma.activity.create({
              data: {
                organizationId: plan.organizationId,
                websiteId: plan.websiteId,
                userId: input.userId,
                type: ActivityType.SYSTEM_NOTICE,
                title: "Autopilot plan item run failed",
                description: `Could not execute "${dueItem.title}".`,
                metadataJson: {
                  planId: plan.id,
                  planItemId: dueItem.id,
                  error: itemResult.error,
                },
              },
            });
          } catch {
            // Activity logging must not block the runner.
          }
        }
      }
    }

    if (planDirty && !dryRun) {
      await prisma.monthlyAutopilotPlan.update({
        where: { id: plan.id },
        data: {
          planItemsJson: planItemsToJson({
            ...document,
            items,
          }),
        },
      });
    }
  }

  return report;
}
