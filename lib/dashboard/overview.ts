import {
  AuditStatus,
  TaskStatus,
  WebsiteStatus,
  type Prisma,
} from "@prisma/client";

import { sortDashboardTasks } from "@/lib/audit/generate-tasks";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import { serializeOrganization } from "@/lib/auth/serialize";
import type { CurrentUser } from "@/lib/auth/types";
import { getSubscriptionPlanSummary } from "@/lib/billing/plan-summary";
import { countActiveQuotaArticleDrafts } from "@/lib/billing/article-usage";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { getSimpleDashboardOverview } from "./simple-overview";
import { loadDashboardGoogleSearchConsole } from "./gsc-overview";
import {
  sortGrowthOpportunities,
} from "@/lib/growth/opportunities";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";
import type { GrowthOpportunity } from "@/lib/growth/types";
import {
  EMPTY_DASHBOARD_GSC,
  type DashboardGoogleSearchConsole,
} from "./types";

export type { DashboardGoogleSearchConsole } from "./types";

export type DashboardOverviewGrowthHistoryEntry = {
  id: string;
  score: number;
  previousScore: number | null;
  delta: number | null;
  reason: string | null;
  source: string;
  createdAt: string;
};

export type DashboardOverviewTask = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  impactScore: number | null;
  createdAt: string;
};

export type DashboardOverviewCheck = {
  code: string;
  category: string;
  status: string;
  severity: string;
  title: string;
  description: string | null;
  scoreImpact: number | null;
  isVisibleInPreview: boolean;
  recommendationJson: Prisma.JsonValue | null;
};

export type DashboardOverviewData = {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  organization: {
    id: string;
    name: string;
  } | null;
  website: {
    id: string;
    url: string;
    displayName: string | null;
    currentGrowthScore: number | null;
    lastAuditAt: string | null;
  } | null;
  subscription: {
    plan: string;
    planLabel: string;
    status: string;
  } | null;
  planLimit: {
    auditsLimit: number;
    auditsUsed: number;
    articlesLimit: number;
    articlesUsed: number;
    socialPostsLimit: number;
    socialPostsUsed: number;
    aiCreditsLimitCents: number | null;
    aiCreditsUsedCents: number;
  } | null;
  latestAudit: {
    id: string;
    type: string;
    status: string;
    growthScore: number | null;
    completedAt: string | null;
  } | null;
  growthScoreDelta: number | null;
  growthHistory: DashboardOverviewGrowthHistoryEntry[];
  checks: DashboardOverviewCheck[];
  tasks: DashboardOverviewTask[];
  activities: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: string;
  }[];
  googleSearchConsole: DashboardGoogleSearchConsole;
  growthOpportunities: GrowthOpportunity[];
  growthOpportunityCount: number;
};

export type DashboardOverviewResponse = {
  data: DashboardOverviewData;
  simple?: import("./simple-overview").SimpleDashboardViewModel;
};

const DEFAULT_PLAN_LIMIT = {
  auditsLimit: 1,
  auditsUsed: 0,
  articlesLimit: 0,
  articlesUsed: 0,
  socialPostsLimit: 0,
  socialPostsUsed: 0,
  aiCreditsLimitCents: null as number | null,
  aiCreditsUsedCents: 0,
};

function serializePlanLimit(
  limit: {
    auditsLimit: number;
    auditsUsed: number;
    articlesLimit: number;
    articlesUsed: number;
    socialPostsLimit: number;
    socialPostsUsed: number;
    aiCreditsLimitCents: number | null;
    aiCreditsUsedCents: number;
  } | null,
  articlesUsedOverride?: number
) {
  if (!limit) {
    return {
      ...DEFAULT_PLAN_LIMIT,
      ...(articlesUsedOverride !== undefined
        ? { articlesUsed: articlesUsedOverride }
        : {}),
    };
  }

  return {
    auditsLimit: limit.auditsLimit,
    auditsUsed: limit.auditsUsed,
    articlesLimit: limit.articlesLimit,
    articlesUsed:
      articlesUsedOverride !== undefined
        ? articlesUsedOverride
        : limit.articlesUsed,
    socialPostsLimit: limit.socialPostsLimit,
    socialPostsUsed: limit.socialPostsUsed,
    aiCreditsLimitCents: limit.aiCreditsLimitCents,
    aiCreditsUsedCents: limit.aiCreditsUsedCents,
  };
}

/**
 * Loads dashboard overview for the authenticated user (website, audit, checks, activity, limits).
 */
export async function getDashboardOverview(
  currentUser: CurrentUser,
  options?: { locale?: import("@/lib/i18n/saas/locales").SaasLocale }
): Promise<DashboardOverviewResponse> {
  const locale = options?.locale ?? "en";
  const prisma = getPrisma();

  const dbUser = await prisma.user.findFirst({
    where: { id: currentUser.id, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      emailVerified: true,
      role: true,
    },
  });

  if (!dbUser) {
    throw new AppError(ErrorCode.NOT_FOUND, "User not found");
  }

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  const subscription = organization
    ? await getSubscriptionPlanSummary({
        userId: currentUser.id,
        organizationId: organization.id,
      })
    : null;

  const planLimitRecord =
    subscription && organization
      ? await prisma.planLimit.findFirst({
          where: {
            subscriptionId: subscription.id,
            organizationId: organization.id,
          },
          orderBy: { periodStart: "desc" },
        })
      : null;

  const liveArticlesUsed = organization
    ? await countActiveQuotaArticleDrafts({
        organizationId: organization.id,
      })
    : 0;

  const activities =
    organization
      ? await prisma.activity.findMany({
          where: { organizationId: organization.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true,
          },
        })
      : [];

  const website = organization
    ? await prisma.website.findFirst({
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
          currentGrowthScore: true,
          lastAuditAt: true,
          organizationId: true,
        },
      })
    : null;

  if (!website) {
    const simple = await getSimpleDashboardOverview(currentUser, {
      subscriptionPlan: subscription?.plan,
      locale,
    });

    return {
      data: {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        },
        organization: organization
          ? serializeOrganization(organization)
          : null,
        website: null,
        subscription: subscription
          ? {
              plan: subscription.plan,
              planLabel: subscription.planLabel,
              status: subscription.status,
            }
          : null,
        planLimit: serializePlanLimit(planLimitRecord, liveArticlesUsed),
        latestAudit: null,
        growthScoreDelta: null,
        growthHistory: [],
        checks: [],
        tasks: [],
        activities: activities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
        })),
        googleSearchConsole: EMPTY_DASHBOARD_GSC,
        growthOpportunities: [],
        growthOpportunityCount: 0,
      },
      simple,
    };
  }

  const latestAudit = await prisma.audit.findFirst({
    where: {
      websiteId: website.id,
      status: AuditStatus.COMPLETED,
      deletedAt: null,
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      growthScore: true,
      completedAt: true,
    },
  });

  const checksRaw = latestAudit
    ? await prisma.auditCheck.findMany({
        where: { auditId: latestAudit.id },
        select: {
          code: true,
          category: true,
          status: true,
          severity: true,
          title: true,
          description: true,
          scoreImpact: true,
          isVisibleInPreview: true,
          recommendationJson: true,
        },
      })
    : [];

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

  const checks = [...checksRaw].sort((a, b) => {
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

  const latestSnapshot = await prisma.growthScoreSnapshot.findFirst({
    where: { websiteId: website.id },
    orderBy: { createdAt: "desc" },
    select: { delta: true },
  });

  const tasksRaw = await prisma.task.findMany({
    where: {
      websiteId: website.id,
      deletedAt: null,
      status: {
        in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
      },
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      priority: true,
      status: true,
      impactScore: true,
      createdAt: true,
    },
  });

  const tasks = sortDashboardTasks(tasksRaw).slice(0, 5);

  const growthHistoryRaw = await prisma.growthScoreSnapshot.findMany({
    where: { websiteId: website.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      score: true,
      previousScore: true,
      delta: true,
      reason: true,
      source: true,
      createdAt: true,
    },
  });

  const growthHistory = [...growthHistoryRaw].reverse().map((snapshot) => ({
    id: snapshot.id,
    score: snapshot.score,
    previousScore: snapshot.previousScore,
    delta: snapshot.delta,
    reason: snapshot.reason,
    source: snapshot.source,
    createdAt: snapshot.createdAt.toISOString(),
  }));

  const googleSearchConsole = await loadDashboardGoogleSearchConsole(website.id);

  const growthOpportunities = sortGrowthOpportunities(
    await syncGrowthOpportunitiesForWebsite({
      websiteId: website.id,
      organizationId: website.organizationId,
      userId: currentUser.id,
    })
  );

  const simple = await getSimpleDashboardOverview(currentUser, {
    opportunitiesCount: growthOpportunities.length,
    subscriptionPlan: subscription?.plan,
    locale,
  });

  return {
    data: {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
      organization: organization
        ? serializeOrganization(organization)
        : null,
      website: {
        id: website.id,
        url: website.url,
        displayName: website.displayName,
        currentGrowthScore: website.currentGrowthScore,
        lastAuditAt: website.lastAuditAt?.toISOString() ?? null,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            planLabel: subscription.planLabel,
            status: subscription.status,
          }
        : null,
      planLimit: serializePlanLimit(planLimitRecord, liveArticlesUsed),
      latestAudit: latestAudit
        ? {
            id: latestAudit.id,
            type: latestAudit.type.toLowerCase(),
            status: latestAudit.status.toLowerCase(),
            growthScore: latestAudit.growthScore,
            completedAt: latestAudit.completedAt?.toISOString() ?? null,
          }
        : null,
      growthScoreDelta: latestSnapshot?.delta ?? null,
      growthHistory,
      checks: checks.map((check) => ({
        code: check.code,
        category: check.category,
        status: check.status,
        severity: check.severity,
        title: check.title,
        description: check.description,
        scoreImpact: check.scoreImpact,
        isVisibleInPreview: check.isVisibleInPreview,
        recommendationJson: check.recommendationJson,
      })),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: task.status,
        impactScore: task.impactScore,
        createdAt: task.createdAt.toISOString(),
      })),
      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt.toISOString(),
      })),
      googleSearchConsole,
      growthOpportunities: growthOpportunities.slice(0, 5),
      growthOpportunityCount: growthOpportunities.length,
    },
    simple,
  };
}
