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

import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import { generateToken } from "@/lib/security";

import type { AuditPreviewResponseData } from "./preview-response";
import type { AuditRuleResult } from "./rules-types";

const PREVIEW_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type CreateAuditPreviewTokenInput = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl: string;
  statusCode: number;
  rawScore: number;
  estimatedFixMinutes: number;
  preview: AuditPreviewResponseData;
  results: AuditRuleResult[];
};

export type ConsumePreviewRegistrationInput = {
  token: string;
  userId: string;
  organizationId: string;
  websiteId: string;
  tx?: Prisma.TransactionClient;
};

export type ConsumePreviewRegistrationResult = {
  attached: boolean;
  auditId?: string;
  reason?: "not_found" | "expired" | "already_used" | "error";
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

function buildGrowthBreakdown(
  preview: AuditPreviewResponseData
): Prisma.InputJsonValue {
  return {
    rawScore: preview.score.raw,
    label: preview.score.label,
    checksCount: preview.checksCount,
    estimatedFixMinutes: preview.summary.estimatedFixMinutes,
  };
}

/**
 * Persists a preview audit result as a temporary token (24h TTL).
 * Returns null when DB is unavailable or persistence fails.
 */
export async function createAuditPreviewToken(
  input: CreateAuditPreviewTokenInput
): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const prisma = getPrisma();
    const token = generateToken("audit");
    const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_MS);

    await prisma.auditPreviewToken.create({
      data: {
        token,
        inputUrl: input.inputUrl,
        normalizedUrl: input.normalizedUrl,
        finalUrl: input.finalUrl,
        statusCode: input.statusCode,
        rawScore: input.rawScore,
        estimatedFixMinutes: input.estimatedFixMinutes,
        summaryJson: input.preview as unknown as Prisma.InputJsonValue,
        previewIssuesJson:
          input.preview.previewIssues as unknown as Prisma.InputJsonValue,
        checksJson: input.results as unknown as Prisma.InputJsonValue,
        expiresAt,
      },
    });

    return token;
  } catch {
    return null;
  }
}

/**
 * Loads a preview token if it exists and is still valid (not used, not expired).
 */
export async function findValidAuditPreviewToken(token: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  try {
    const prisma = getPrisma();
    const record = await prisma.auditPreviewToken.findUnique({
      where: { token },
    });

    if (!record || record.usedAt !== null || record.expiresAt <= new Date()) {
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

/**
 * Creates Audit, AuditCheck rows, GrowthScoreSnapshot, and Activity records
 * from a consumed preview token during registration.
 */
export async function consumeAuditPreviewTokenForRegistration(
  input: ConsumePreviewRegistrationInput
): Promise<ConsumePreviewRegistrationResult> {
  const db = input.tx ?? getPrisma();
  const now = new Date();

  try {
    const record = await db.auditPreviewToken.findUnique({
      where: { token: input.token },
    });

    if (!record) {
      return { attached: false, reason: "not_found" };
    }
    if (record.usedAt !== null) {
      return { attached: false, reason: "already_used" };
    }
    if (record.expiresAt <= now) {
      return { attached: false, reason: "expired" };
    }

    const preview = record.summaryJson as unknown as AuditPreviewResponseData;
    const checks = record.checksJson as unknown as AuditRuleResult[];

    const marked = await db.auditPreviewToken.updateMany({
      where: {
        id: record.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (marked.count === 0) {
      return { attached: false, reason: "already_used" };
    }

    const audit = await db.audit.create({
      data: {
        websiteId: input.websiteId,
        type: AuditType.PREVIEW,
        status: AuditStatus.COMPLETED,
        triggeredBy: AuditTriggeredBy.ONBOARDING,
        triggeredByUserId: input.userId,
        growthScore: record.rawScore,
        aiReadinessScore: null,
        summaryJson: preview as unknown as Prisma.InputJsonValue,
        visiblePreviewJson:
          record.previewIssuesJson as Prisma.InputJsonValue,
        rawResultJson: checks as unknown as Prisma.InputJsonValue,
        startedAt: record.createdAt,
        completedAt: now,
      },
    });

    if (checks.length > 0) {
      await db.auditCheck.createMany({
        data: checks.map((check) =>
          ruleResultToAuditCheck(check, audit.id, input.websiteId)
        ),
      });
    }

    await db.growthScoreSnapshot.create({
      data: {
        websiteId: input.websiteId,
        auditId: audit.id,
        score: record.rawScore,
        previousScore: null,
        delta: null,
        breakdownJson: buildGrowthBreakdown(preview),
        reason: "Preview audit attached on registration",
        source: ScoreSource.AUDIT,
      },
    });

    await db.activity.createMany({
      data: [
        {
          organizationId: input.organizationId,
          websiteId: input.websiteId,
          userId: input.userId,
          type: ActivityType.AUDIT_STARTED,
          title: "Запущен preview-аудит",
          description: `Проверка ${record.finalUrl}`,
          metadataJson: { auditId: audit.id, source: "preview_token" },
        },
        {
          organizationId: input.organizationId,
          websiteId: input.websiteId,
          userId: input.userId,
          type: ActivityType.AUDIT_COMPLETED,
          title: "Preview-аудит завершён",
          description: `Growth Score: ${record.rawScore}`,
          metadataJson: {
            auditId: audit.id,
            growthScore: record.rawScore,
            source: "preview_token",
          },
        },
        {
          organizationId: input.organizationId,
          websiteId: input.websiteId,
          userId: input.userId,
          type: ActivityType.GROWTH_SCORE_UPDATED,
          title: "Growth Score обновлён",
          description: `Новый score: ${record.rawScore}`,
          metadataJson: {
            auditId: audit.id,
            score: record.rawScore,
            source: "preview_token",
          },
        },
      ],
    });

    await db.website.update({
      where: { id: input.websiteId },
      data: {
        currentGrowthScore: record.rawScore,
        lastAuditAt: now,
      },
    });

    return { attached: true, auditId: audit.id };
  } catch {
    return { attached: false, reason: "error" };
  }
}
