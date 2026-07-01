import {
  ActivityType,
  AuditCheckCategory,
  AuditCheckSeverity,
  AuditCheckStatus,
  AuditStatus,
  AuditTriggeredBy,
  AuditType,
  ScoreSource,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode, toAppError } from "@/lib/errors";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

import { extractOnPageSeo } from "./extractors";
import { generateTasksFromAuditChecks } from "./generate-tasks";
import { buildAuditPreviewResponse } from "./preview-response";
import {
  calculateEstimatedFixTime,
  calculateRawRuleScore,
  getPreviewIssues,
  runAuditRules,
} from "./rule-engine";
import type { AuditRuleResult } from "./rules-types";
import { scanWebsite } from "./scanner";

export type RunAndPersistWebsiteAuditInput = {
  websiteId: string;
  userId: string;
  trigger: AuditTriggeredBy;
};

export type RunAndPersistWebsiteAuditResult = {
  auditId: string;
  score: number;
  delta: number | null;
  tasksCreated: number;
};

function mapCheckCategory(category: string): AuditCheckCategory {
  if (
    Object.values(AuditCheckCategory).includes(category as AuditCheckCategory)
  ) {
    return category as AuditCheckCategory;
  }
  return AuditCheckCategory.OTHER;
}

function mapCheckSeverity(severity: string): AuditCheckSeverity {
  if (
    Object.values(AuditCheckSeverity).includes(severity as AuditCheckSeverity)
  ) {
    return severity as AuditCheckSeverity;
  }
  return AuditCheckSeverity.INFO;
}

function mapCheckStatus(status: string): AuditCheckStatus {
  if (Object.values(AuditCheckStatus).includes(status as AuditCheckStatus)) {
    return status as AuditCheckStatus;
  }
  return AuditCheckStatus.NOT_APPLICABLE;
}

function ruleResultToAuditCheck(
  result: AuditRuleResult,
  auditId: string,
  websiteId: string
): Prisma.AuditCheckCreateManyInput {
  return {
    auditId,
    websiteId,
    category: mapCheckCategory(result.category),
    code: result.code,
    title: result.title,
    description: result.description,
    severity: mapCheckSeverity(result.severity),
    status: mapCheckStatus(result.status),
    scoreImpact: result.scoreImpact,
    isVisibleInPreview: result.isVisibleInPreview,
    recommendationJson: {
      recommendation: result.recommendation,
      whyItMatters: result.whyItMatters,
      estimatedFixMinutes: result.estimatedFixMinutes,
    },
    evidenceJson: (result.evidence ?? undefined) as Prisma.InputJsonValue | undefined,
  };
}

function buildSnapshotBreakdown(
  checksCount: AuditRuleResult[],
  estimatedFixMinutes: number,
  rawScore: number
): Prisma.InputJsonValue {
  const results = checksCount;
  return {
    source: "rule_engine_v1",
    rawScore,
    checksCount: {
      total: results.length,
      pass: results.filter((r) => r.status === "PASS").length,
      warning: results.filter((r) => r.status === "WARNING").length,
      fail: results.filter((r) => r.status === "FAIL").length,
    },
    estimatedFixMinutes,
  };
}

async function markAuditFailed(
  auditId: string,
  organizationId: string,
  websiteId: string,
  userId: string,
  websiteUrl: string,
  error: unknown
): Promise<never> {
  const appError = toAppError(error);
  const prisma = getPrisma();
  const now = new Date();

  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: AuditStatus.FAILED,
      failedAt: now,
      errorCode: appError.code,
      errorMessage: appError.message,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId,
      websiteId,
      userId,
      type: ActivityType.AUDIT_FAILED,
      title: "Проверка сайта не завершилась",
      description: appError.message,
      metadataJson: {
        auditId,
        url: websiteUrl,
        errorCode: appError.code,
      },
    },
  });

  throw appError;
}

/**
 * Runs the rule-engine audit pipeline for a website and persists results to the database.
 * Synchronous MVP — no background queue.
 */
export async function runAndPersistWebsiteAudit(
  input: RunAndPersistWebsiteAuditInput
): Promise<RunAndPersistWebsiteAuditResult> {
  const prisma = getPrisma();
  const startedAt = new Date();

  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      deletedAt: null,
      organization: {
        ownerUserId: input.userId,
        deletedAt: null,
      },
    },
    include: {
      organization: true,
    },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден или недоступен");
  }

  const audit = await prisma.audit.create({
    data: {
      websiteId: website.id,
      type: AuditType.PREVIEW,
      status: AuditStatus.QUEUED,
      triggeredBy: input.trigger,
      triggeredByUserId: input.userId,
      startedAt,
    },
  });

  await prisma.activity.create({
    data: {
      organizationId: website.organizationId,
      websiteId: website.id,
      userId: input.userId,
      type: ActivityType.AUDIT_STARTED,
      title: "Запущена проверка сайта",
      description: `Проверяем ${website.url}`,
      metadataJson: { auditId: audit.id, source: "dashboard_rerun" },
    },
  });

  let results: AuditRuleResult[];

  try {
    const scan = await scanWebsite(website.url);
    const onPage = extractOnPageSeo(scan.html, scan.finalUrl);
    results = runAuditRules({ scan, onPage });

    const previewPayload = buildAuditPreviewResponse({
      inputUrl: website.url,
      scan,
      onPage,
      results,
      generatedAt: scan.fetchedAt,
    });

    const rawScore = calculateRawRuleScore(results);
    const estimatedFixMinutes = calculateEstimatedFixTime(results);
    const previousScore = website.currentGrowthScore;
    const delta =
      previousScore != null ? rawScore - previousScore : null;
    const completedAt = new Date();
    const previewIssues = getPreviewIssues(results, 5);
    let tasksCreated = 0;

    await prisma.$transaction(async (tx) => {
      if (results.length > 0) {
        await tx.auditCheck.createMany({
          data: results.map((check) =>
            ruleResultToAuditCheck(check, audit.id, website.id)
          ),
        });

        const taskResult = await generateTasksFromAuditChecks({
          auditId: audit.id,
          websiteId: website.id,
          organizationId: website.organizationId,
          userId: input.userId,
          tx,
        });
        tasksCreated = taskResult.tasksCreated;
      }

      await tx.growthScoreSnapshot.create({
        data: {
          websiteId: website.id,
          auditId: audit.id,
          score: rawScore,
          previousScore,
          delta,
          breakdownJson: buildSnapshotBreakdown(
            results,
            estimatedFixMinutes,
            rawScore
          ),
          reason: "Dashboard audit rerun",
          source: ScoreSource.AUDIT,
        },
      });

      await tx.audit.update({
        where: { id: audit.id },
        data: {
          status: AuditStatus.COMPLETED,
          growthScore: rawScore,
          summaryJson: previewPayload.data as unknown as Prisma.InputJsonValue,
          visiblePreviewJson:
            previewIssues as unknown as Prisma.InputJsonValue,
          rawResultJson: results as unknown as Prisma.InputJsonValue,
          completedAt,
        },
      });

      await tx.website.update({
        where: { id: website.id },
        data: {
          currentGrowthScore: rawScore,
          lastAuditAt: completedAt,
        },
      });

      await tx.activity.createMany({
        data: [
          {
            organizationId: website.organizationId,
            websiteId: website.id,
            userId: input.userId,
            type: ActivityType.AUDIT_COMPLETED,
            title: "Проверка сайта завершена",
            description: `Growth Score: ${rawScore}${
              delta != null ? ` (${delta >= 0 ? "+" : ""}${delta})` : ""
            }`,
            metadataJson: {
              auditId: audit.id,
              growthScore: rawScore,
              delta,
              source: "dashboard_rerun",
            },
          },
          {
            organizationId: website.organizationId,
            websiteId: website.id,
            userId: input.userId,
            type: ActivityType.GROWTH_SCORE_UPDATED,
            title: "Growth Score обновлён",
            description: `Новый score: ${rawScore}`,
            metadataJson: {
              auditId: audit.id,
              score: rawScore,
              previousScore,
              delta,
              source: "dashboard_rerun",
            },
          },
        ],
      });
    });

    try {
      const findingsCount = results.filter(
        (check) => check.status === "FAIL" || check.status === "WARNING"
      ).length;
      const { timelineAfterAuditCompleted, timelineAfterScoreChanged } =
        await import("@/lib/timeline/hooks");

      await timelineAfterAuditCompleted({
        userId: input.userId,
        websiteId: website.id,
        growthScore: rawScore,
        tasksCreated,
        findingsCount,
      });

      if (delta != null && delta !== 0) {
        await timelineAfterScoreChanged({
          userId: input.userId,
          websiteId: website.id,
          previousScore,
          newScore: rawScore,
          delta,
        });
      }
    } catch {
      // Timeline sync must not block audit completion.
    }

    try {
      await syncGrowthOpportunitiesForWebsite({
        websiteId: website.id,
        organizationId: website.organizationId,
        userId: input.userId,
      });
    } catch {
      // Growth sync must not block audit completion.
    }

    return {
      auditId: audit.id,
      score: rawScore,
      delta,
      tasksCreated,
    };
  } catch (error) {
    return markAuditFailed(
      audit.id,
      website.organizationId,
      website.id,
      input.userId,
      website.url,
      error
    );
  }
}
