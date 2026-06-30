import {
  AuditStatus,
  WebsiteStatus,
  type Prisma,
} from "@prisma/client";

import { findActiveSubscription, findPrimaryOrganization } from "@/lib/auth/queries";
import {
  serializeOrganization,
  serializeSubscription,
} from "@/lib/auth/serialize";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

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
  checks: DashboardOverviewCheck[];
  activities: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    createdAt: string;
  }[];
};

export type DashboardOverviewResponse = {
  data: DashboardOverviewData;
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
  } | null
) {
  if (!limit) {
    return DEFAULT_PLAN_LIMIT;
  }

  return {
    auditsLimit: limit.auditsLimit,
    auditsUsed: limit.auditsUsed,
    articlesLimit: limit.articlesLimit,
    articlesUsed: limit.articlesUsed,
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
  currentUser: CurrentUser
): Promise<DashboardOverviewResponse> {
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
    throw new Error("User not found");
  }

  let organization = currentUser.organizationId
    ? await prisma.organization.findFirst({
        where: { id: currentUser.organizationId, deletedAt: null },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, currentUser.id);
  }

  const subscription = organization
    ? await findActiveSubscription(prisma, organization.id)
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
        },
      })
    : null;

  if (!website) {
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
              plan: serializeSubscription(subscription).plan,
              status: serializeSubscription(subscription).status,
            }
          : null,
        planLimit: serializePlanLimit(planLimitRecord),
        latestAudit: null,
        growthScoreDelta: null,
        checks: [],
        activities: activities.map((activity) => ({
          id: activity.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          createdAt: activity.createdAt.toISOString(),
        })),
      },
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
            plan: serializeSubscription(subscription).plan,
            status: serializeSubscription(subscription).status,
          }
        : null,
      planLimit: serializePlanLimit(planLimitRecord),
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
      activities: activities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt.toISOString(),
      })),
    },
  };
}
