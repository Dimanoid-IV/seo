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
import { refreshAutopilotPlanItemResearchBrief } from "@/lib/content-research/refresh-plan-item-brief";
import { briefToJson } from "@/lib/content-research/parse";
import { preparePublishingHandoff } from "@/lib/publishing/prepare-publishing-handoff";
import { getCustomPublishingConfig } from "@/lib/publishing/custom-webhook-config";
import { runWordPressLivePublishForPlanArticle } from "@/lib/integrations/adapters/wordpress/run-live-publish";
import { resolveLivePublishScope } from "@/lib/integrations/live-publish-rollout";
import { isPlanAutoPublishMode } from "./plan-publishing-mode";

import {
  classifyDryRunOutcome,
  consumeBudgetForAction,
  createDefaultRunBudget,
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
  would?: string;
};

export type RunScheduledAutopilotReport = {
  dryRun: boolean;
  plansScanned: number;
  dueItemsFound: number;
  /** Dry-run only: actions that would run if dryRun=false. */
  wouldRunCount: number;
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
    wouldRunCount: 0,
    executedCount: 0,
    skippedCount: 0,
    blockedCount: 0,
    errorCount: 0,
    results: [],
  };

  if (settings.mode === AutopilotMode.OFF) {
    return report;
  }

  const [plans, wpConnection, customPublishing] = await Promise.all([
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
    getCustomPublishingConfig(website.id),
  ]);

  const wordpressConnected =
    wpConnection?.status === WordPressConnectionStatus.CONNECTED;
  const webhookConfiguredAndTested = Boolean(
    customPublishing?.testedAt && customPublishing.endpointConfigured
  );
  const livePublishScope = resolveLivePublishScope({
    websiteId: website.id,
    dbRolloutEnabled: website.livePublishRolloutEnabled,
  });
  const websiteLivePublishPaused = website.autopilotLivePublishPaused === true;
  const customWebhookAutoSendAllowed =
    webhookConfiguredAndTested &&
    livePublishScope.allowed &&
    !websiteLivePublishPaused;

  report.plansScanned = plans.length;
  const budget = createDefaultRunBudget();

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
          webhookConfiguredAndTested,
          customWebhookAutoSendAllowed:
            customWebhookAutoSendAllowed &&
            isPlanAutoPublishMode(plan.publishingMode),
          planPublishingMode: plan.publishingMode,
        });

        itemResult.action = eligibility.action;
        itemResult.reasonKey = eligibility.reasonKey;
        itemResult.summaryKey = eligibility.summaryKey;
        itemResult.eligible = eligibility.eligible;
        itemResult.nextStatus = eligibility.suggestedStatus;
        itemResult.would = eligibility.summaryKey;

        if (!eligibility.eligible) {
          if (eligibility.action === "BLOCKED" && eligibility.persistBlocked) {
            report.blockedCount += 1;
            if (!dryRun) {
              items = applyPlanItemUpdate(items, currentItem.id, {
                status: "blocked",
                blockedReasonKey: eligibility.reasonKey,
                pipelineState: "FAILED",
              });
              planDirty = true;
            }
          } else {
            report.skippedCount += 1;
          }

          report.results.push(itemResult);
          continue;
        }

        if (!consumeBudgetForAction(budget, eligibility.action)) {
          itemResult.eligible = false;
          itemResult.action = "SKIP";
          itemResult.reasonKey = "runBudgetExhausted";
          itemResult.summaryKey = "runBudgetExhausted";
          report.skippedCount += 1;
          report.results.push(itemResult);
          continue;
        }

        if (dryRun) {
          const outcome = classifyDryRunOutcome(eligibility);
          itemResult.executed = false;
          if (outcome === "wouldRun") {
            report.wouldRunCount += 1;
          } else {
            report.skippedCount += 1;
            itemResult.eligible = false;
            itemResult.action = "SKIP";
          }
          report.results.push(itemResult);
          continue;
        }

        if (eligibility.action === "PREPARE_RESEARCH_BRIEF") {
          const refreshed = await refreshAutopilotPlanItemResearchBrief({
            planId: plan.id,
            itemId: currentItem.id,
            userId: input.userId,
            organizationId: organization.id,
          });

          items = applyPlanItemUpdate(items, currentItem.id, {
            researchBrief: briefToJson(refreshed.brief) as Record<string, unknown>,
            pipelineState: refreshed.ready ? "RESEARCH_READY" : "FAILED",
            nextAutomatedStep: refreshed.ready ? "generate_draft" : "none",
            blockedReasonKey: refreshed.blockedReasonKey,
            status: refreshed.blockedReasonKey ? "blocked" : "scheduled",
          });
          planDirty = true;
          itemResult.executed = true;
          itemResult.nextStatus = refreshed.blockedReasonKey ? "blocked" : "scheduled";
          report.executedCount += 1;

          try {
            await timelineAfterAutopilotPlanItemExecuted({
              userId: input.userId,
              websiteId: plan.websiteId,
              planId: plan.id,
              planItemId: currentItem.id,
              action: "PREPARE_RESEARCH_BRIEF",
              itemTitle: currentItem.title,
            });
          } catch {
            // Timeline must not block execution.
          }
        } else if (eligibility.action === "PREPARE_ARTICLE_DRAFT") {
          items = applyPlanItemUpdate(items, currentItem.id, {
            pipelineState: "DRAFT_GENERATING",
          });

          const draftResult = await generatePlanItemArticleDraft({
            planId: plan.id,
            planItemId: currentItem.id,
            userId: input.userId,
            organizationId: organization.id,
          });

          const qualityPassed = draftResult.planItem.articleQualityPassed;
          items = applyPlanItemUpdate(items, currentItem.id, {
            status: "prepared",
            generatedArticleId: draftResult.planItem.generatedArticleId,
            articleQualityScore: draftResult.planItem.articleQualityScore,
            articleQualityPassed: qualityPassed,
            reviewQueueHref: draftResult.planItem.reviewQueueHref,
            blockedReasonKey: qualityPassed ? undefined : "articleNeedsRevision",
            pipelineState: qualityPassed
              ? "DRAFT_READY_FOR_REVIEW"
              : "QUALITY_FAILED_NEEDS_REPAIR",
            nextAutomatedStep: qualityPassed
              ? "prepare_publishing_handoff"
              : "repair_quality",
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

          // Same-run handoff when quality passed and budget allows.
          // REVIEW / approved-plan modes → draft/package. AUTOPUBLISH + AUTO_PUBLISH → live.
          const afterDraft = items.find((i) => i.id === currentItem.id)!;
          if (
            qualityPassed &&
            settings.mode === AutopilotMode.APPROVED_PLAN_AUTOPILOT &&
            consumeBudgetForAction(budget, "PREPARE_PUBLISHING_HANDOFF")
          ) {
            const handoff = await preparePublishingHandoff({
              articleId: draftResult.planItem.generatedArticleId,
              userId: input.userId,
              websiteId: plan.websiteId,
              organizationId: plan.organizationId,
              autopilotMode: settings.mode,
              wordpressConnected,
              currentItem: afterDraft,
              planId: plan.id,
              planItemId: currentItem.id,
              customWebhookAutoSendAllowed: false,
            });
            items = applyPlanItemUpdate(items, currentItem.id, handoff.patch);
            report.results.push({
              ...itemResult,
              action: "PREPARE_PUBLISHING_HANDOFF",
              reasonKey: "readyForPublishingHandoff",
              summaryKey: handoff.summaryKey,
              would: handoff.summaryKey,
              nextStatus: handoff.patch.status,
            });
            continue;
          }

          if (
            qualityPassed &&
            settings.mode === AutopilotMode.AUTOPUBLISH &&
            isPlanAutoPublishMode(plan.publishingMode) &&
            wordpressConnected &&
            consumeBudgetForAction(budget, "LIVE_PUBLISH_ARTICLE")
          ) {
            const live = await runWordPressLivePublishForPlanArticle({
              userId: input.userId,
              organizationId: plan.organizationId,
              websiteId: plan.websiteId,
              articleId: draftResult.planItem.generatedArticleId,
              planId: plan.id,
              planItem: afterDraft,
              planStatus: plan.status,
              planPublishingMode: plan.publishingMode,
              autopilotMode: settings.mode,
            });

            if (live.livePublished) {
              items = applyPlanItemUpdate(items, currentItem.id, {
                status: "published",
                blockedReasonKey: undefined,
                pipelineState: "WORDPRESS_LIVE_PUBLISHED",
                publishingPath: "wordpress_live",
                nextAutomatedStep: "done",
              });
              report.results.push({
                ...itemResult,
                action: "LIVE_PUBLISH_ARTICLE",
                reasonKey: "readyForLivePublish",
                summaryKey: live.summaryKey,
                would: live.summaryKey,
                nextStatus: "published",
                executed: true,
              });
            } else {
              items = applyPlanItemUpdate(items, currentItem.id, {
                status: "blocked",
                blockedReasonKey:
                  live.blockedReason ??
                  live.gate.blockedReason ??
                  "livePublishBlocked",
                reviewQueueHref: "/app/review",
                nextAutomatedStep: "review_before_publish",
              });
              report.blockedCount += 1;
              report.results.push({
                ...itemResult,
                action: "LIVE_PUBLISH_ARTICLE",
                reasonKey: "livePublishBlocked",
                summaryKey: live.summaryKey,
                nextStatus: "blocked",
                executed: Boolean(live.executed),
              });
            }
            continue;
          }

          if (
            qualityPassed &&
            settings.mode === AutopilotMode.AUTOPUBLISH &&
            isPlanAutoPublishMode(plan.publishingMode) &&
            !wordpressConnected &&
            webhookConfiguredAndTested &&
            consumeBudgetForAction(budget, "PREPARE_PUBLISHING_HANDOFF")
          ) {
            const handoff = await preparePublishingHandoff({
              articleId: draftResult.planItem.generatedArticleId,
              userId: input.userId,
              websiteId: plan.websiteId,
              organizationId: plan.organizationId,
              autopilotMode: settings.mode,
              wordpressConnected,
              currentItem: afterDraft,
              planId: plan.id,
              planItemId: currentItem.id,
              customWebhookAutoSendAllowed: customWebhookAutoSendAllowed,
            });

            items = applyPlanItemUpdate(items, currentItem.id, handoff.patch);
            report.results.push({
              ...itemResult,
              action: "PREPARE_PUBLISHING_HANDOFF",
              reasonKey: "readyForPublishingHandoff",
              summaryKey: handoff.summaryKey,
              would: handoff.summaryKey,
              nextStatus: handoff.patch.status,
              executed: handoff.webhookDelivered === true || itemResult.executed,
            });
            continue;
          }
        } else if (eligibility.action === "PREPARE_PUBLISHING_HANDOFF") {
          if (!currentItem.generatedArticleId) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              "Generated article missing for publishing handoff."
            );
          }

          const handoff = await preparePublishingHandoff({
            articleId: currentItem.generatedArticleId,
            userId: input.userId,
            websiteId: plan.websiteId,
            organizationId: plan.organizationId,
            autopilotMode: settings.mode,
            wordpressConnected,
            currentItem,
            planId: plan.id,
            planItemId: currentItem.id,
            customWebhookAutoSendAllowed:
              settings.mode === AutopilotMode.AUTOPUBLISH &&
              isPlanAutoPublishMode(plan.publishingMode) &&
              customWebhookAutoSendAllowed,
          });

          items = applyPlanItemUpdate(items, currentItem.id, handoff.patch);
          planDirty = true;
          itemResult.executed = true;
          itemResult.nextStatus = handoff.patch.status;
          itemResult.summaryKey = handoff.summaryKey;
          report.executedCount += 1;

          try {
            await timelineAfterAutopilotPlanItemExecuted({
              userId: input.userId,
              websiteId: plan.websiteId,
              planId: plan.id,
              planItemId: currentItem.id,
              action: "PREPARE_PUBLISHING_HANDOFF",
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
            pipelineState: "WORDPRESS_DRAFT_CREATED",
            publishingPath: "wordpress_draft",
            wordpressDraftCreatedAt: new Date().toISOString(),
            nextAutomatedStep: "review_wordpress_draft",
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
        } else if (eligibility.action === "LIVE_PUBLISH_ARTICLE") {
          if (!currentItem.generatedArticleId) {
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              "Generated article missing for live publish step."
            );
          }

          // REVIEW_ONLY plans never enter this branch (eligibility guards).
          if (
            !isPlanAutoPublishMode(plan.publishingMode) ||
            settings.mode !== AutopilotMode.AUTOPUBLISH
          ) {
            items = applyPlanItemUpdate(items, currentItem.id, {
              status: "blocked",
              blockedReasonKey: "plan_review_only",
              reviewQueueHref: "/app/review",
              nextAutomatedStep: "review_before_publish",
            });
            planDirty = true;
            itemResult.executed = false;
            itemResult.nextStatus = "blocked";
            itemResult.summaryKey = "plan_review_only";
            report.blockedCount += 1;
            report.results.push(itemResult);
            continue;
          }

          const live = await runWordPressLivePublishForPlanArticle({
            userId: input.userId,
            organizationId: plan.organizationId,
            websiteId: plan.websiteId,
            articleId: currentItem.generatedArticleId,
            planId: plan.id,
            planItem: currentItem,
            planStatus: plan.status,
            planPublishingMode: plan.publishingMode,
            autopilotMode: settings.mode,
          });

          if (!live.allowed || !live.livePublished) {
            items = applyPlanItemUpdate(items, currentItem.id, {
              status: "blocked",
              blockedReasonKey:
                live.blockedReason ?? live.gate.blockedReason ?? "livePublishBlocked",
              reviewQueueHref: "/app/review",
              nextAutomatedStep: "review_before_publish",
              pipelineState:
                live.articleStatus === "WORDPRESS_DRAFT_CREATED"
                  ? "WORDPRESS_DRAFT_CREATED"
                  : "FAILED",
            });
            planDirty = true;
            itemResult.executed = Boolean(live.executed);
            itemResult.nextStatus = "blocked";
            itemResult.summaryKey = live.summaryKey;
            itemResult.reasonKey = "livePublishBlocked";
            report.blockedCount += 1;

            try {
              await timelineAfterAutopilotPlanItemExecuted({
                userId: input.userId,
                websiteId: plan.websiteId,
                planId: plan.id,
                planItemId: currentItem.id,
                action: "LIVE_PUBLISH_ARTICLE",
                itemTitle: currentItem.title,
              });
            } catch {
              // Timeline must not block execution.
            }

            report.results.push(itemResult);
            continue;
          }

          items = applyPlanItemUpdate(items, currentItem.id, {
            status: "published",
            blockedReasonKey: undefined,
            pipelineState: "WORDPRESS_LIVE_PUBLISHED",
            publishingPath: "wordpress_live",
            nextAutomatedStep: "done",
            reviewQueueHref: undefined,
          });
          planDirty = true;
          itemResult.executed = true;
          itemResult.nextStatus = "published";
          itemResult.summaryKey = live.summaryKey;
          report.executedCount += 1;

          try {
            await timelineAfterAutopilotPlanItemExecuted({
              userId: input.userId,
              websiteId: plan.websiteId,
              planId: plan.id,
              planItemId: currentItem.id,
              action: "LIVE_PUBLISH_ARTICLE",
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
                description: `Could not execute plan item.`,
                metadataJson: {
                  planId: plan.id,
                  planItemId: dueItem.id,
                  action: itemResult.action,
                  // Never log secrets / webhook URLs / article body.
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
