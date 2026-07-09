import "server-only";

import {
  ArticleStatus,
  AuditCheckStatus,
  AuditStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { isHermesConfigured } from "@/lib/hermes/client";

export type HomeScreenState =
  | "NO_WEBSITE"
  | "NO_AUDIT"
  | "AUDIT_RUNNING"
  | "NEEDS_FIX"
  | "FIX_READY";

export type HomeTopIssue = {
  code: string;
  title: string;
  description: string | null;
  severity: string;
  category: string;
};

export type HomeGeneratedFix = {
  id: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  contentHtml: string | null;
  topic: string | null;
  status: string;
  approvedAt: string | null;
  createdAt: string;
};

export type HomeScreenData = {
  state: HomeScreenState;
  website: {
    id: string;
    url: string;
    displayName: string | null;
  } | null;
  topIssue: HomeTopIssue | null;
  generatedFix: HomeGeneratedFix | null;
  hermesAvailable: boolean;
  latestAudit: {
    id: string;
    growthScore: number | null;
    completedAt: string | null;
  } | null;
  auditError: string | null;
};

const STATUS_ORDER: Record<string, number> = {
  FAIL: 0,
  WARNING: 1,
  NOT_APPLICABLE: 2,
  PASS: 3,
};

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

function sortAuditChecks<
  T extends {
    status: string;
    severity: string;
    scoreImpact: number | null;
  },
>(checks: T[]): T[] {
  return [...checks].sort((a, b) => {
    const statusDiff =
      (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) {
      return statusDiff;
    }
    const severityDiff =
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99);
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return (b.scoreImpact ?? 0) - (a.scoreImpact ?? 0);
  });
}

function defaultTopIssue(): HomeTopIssue {
  return {
    code: "homepage-seo",
    title: "Improve homepage SEO copy",
    description:
      "RankBoost can draft improved titles and descriptions for your homepage.",
    severity: "MEDIUM",
    category: "CONTENT",
  };
}

/**
 * Lightweight home screen payload for /app — no GSC sync, autopilot, or growth opportunities.
 */
export async function getHomeScreenData(
  currentUser: CurrentUser
): Promise<HomeScreenData> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    return {
      state: "NO_WEBSITE",
      website: null,
      topIssue: null,
      generatedFix: null,
      hermesAvailable: isHermesConfigured(),
      latestAudit: null,
      auditError: null,
    };
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      displayName: true,
    },
  });

  if (!website) {
    return {
      state: "NO_WEBSITE",
      website: null,
      topIssue: null,
      generatedFix: null,
      hermesAvailable: isHermesConfigured(),
      latestAudit: null,
      auditError: null,
    };
  }

  const [latestCompletedAudit, runningAudit, failedAudit, generatedFix] =
    await Promise.all([
      prisma.audit.findFirst({
        where: {
          websiteId: website.id,
          status: AuditStatus.COMPLETED,
          deletedAt: null,
        },
        orderBy: { completedAt: "desc" },
        select: {
          id: true,
          growthScore: true,
          completedAt: true,
        },
      }),
      prisma.audit.findFirst({
        where: {
          websiteId: website.id,
          status: {
            in: [
              AuditStatus.QUEUED,
              AuditStatus.CRAWLING,
              AuditStatus.ANALYZING,
              AuditStatus.SCORING,
            ],
          },
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      }),
      prisma.audit.findFirst({
        where: {
          websiteId: website.id,
          status: AuditStatus.FAILED,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, errorMessage: true },
      }),
      prisma.article.findFirst({
        where: {
          websiteId: website.id,
          deletedAt: null,
          status: { in: [ArticleStatus.DRAFT, ArticleStatus.APPROVED] },
          contentHtml: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          metaTitle: true,
          metaDescription: true,
          contentHtml: true,
          topic: true,
          status: true,
          approvedAt: true,
          createdAt: true,
        },
      }),
    ]);

  const hermesAvailable = isHermesConfigured();

  if (runningAudit) {
    return {
      state: "AUDIT_RUNNING",
      website,
      topIssue: null,
      generatedFix: null,
      hermesAvailable,
      latestAudit: latestCompletedAudit
        ? {
            id: latestCompletedAudit.id,
            growthScore: latestCompletedAudit.growthScore,
            completedAt:
              latestCompletedAudit.completedAt?.toISOString() ?? null,
          }
        : null,
      auditError: null,
    };
  }

  if (!latestCompletedAudit) {
    return {
      state: "NO_AUDIT",
      website,
      topIssue: null,
      generatedFix: null,
      hermesAvailable,
      latestAudit: null,
      auditError: failedAudit?.errorMessage?.slice(0, 200) ?? null,
    };
  }

  const checksRaw = await prisma.auditCheck.findMany({
    where: {
      auditId: latestCompletedAudit.id,
      status: { in: [AuditCheckStatus.FAIL, AuditCheckStatus.WARNING] },
    },
    select: {
      code: true,
      title: true,
      description: true,
      severity: true,
      category: true,
      status: true,
      scoreImpact: true,
    },
  });

  const sortedChecks = sortAuditChecks(checksRaw);
  const topIssue: HomeTopIssue =
    sortedChecks.length > 0
      ? {
          code: sortedChecks[0].code,
          title: sortedChecks[0].title,
          description: sortedChecks[0].description,
          severity: sortedChecks[0].severity,
          category: sortedChecks[0].category,
        }
      : defaultTopIssue();

  const latestAudit = {
    id: latestCompletedAudit.id,
    growthScore: latestCompletedAudit.growthScore,
    completedAt: latestCompletedAudit.completedAt?.toISOString() ?? null,
  };

  if (generatedFix?.contentHtml) {
    return {
      state: "FIX_READY",
      website,
      topIssue,
      generatedFix: {
        id: generatedFix.id,
        title: generatedFix.title,
        metaTitle: generatedFix.metaTitle,
        metaDescription: generatedFix.metaDescription,
        contentHtml: generatedFix.contentHtml,
        topic: generatedFix.topic,
        status: generatedFix.status,
        approvedAt: generatedFix.approvedAt?.toISOString() ?? null,
        createdAt: generatedFix.createdAt.toISOString(),
      },
      hermesAvailable,
      latestAudit,
      auditError: null,
    };
  }

  return {
    state: "NEEDS_FIX",
    website,
    topIssue,
    generatedFix: null,
    hermesAvailable,
    latestAudit,
    auditError: null,
  };
}

export function buildFixTopicFromIssue(
  issue: HomeTopIssue,
  locale: "en" | "ru" | "et" = "en"
): string {
  if (locale === "ru") {
    return `Улучшение SEO: ${issue.title}`;
  }
  if (locale === "et") {
    return `SEO parandus: ${issue.title}`;
  }
  return `Homepage SEO improvement: ${issue.title}`;
}

export function assertHomeWebsiteAccess(
  currentUser: CurrentUser,
  websiteId: string
): Promise<{ id: string; organizationId: string }> {
  const prisma = getPrisma();
  return prisma.website
    .findFirst({
      where: {
        id: websiteId,
        deletedAt: null,
        organization: {
          ownerUserId: currentUser.id,
          deletedAt: null,
        },
      },
      select: { id: true, organizationId: true },
    })
    .then((website) => {
      if (!website) {
        throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
      }
      return website;
    });
}
