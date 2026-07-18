import "server-only";

import type { UsageKey } from "@prisma/client";

import { monthPeriod } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";

import {
  countActiveQuotaArticleDrafts,
  currentArticleUsageMonthKey,
  reconcileArticleDraftUsage,
} from "./article-usage";
import {
  BILLING_PLANS,
  normalizeBillingPlan,
  type BillingPlanKey,
} from "./plans";
import type { UsageSummaryViewModel } from "./types";
import { USAGE_KEY_LABELS } from "./types";
import { getCurrentSubscription } from "./get-subscription";

function currentMonthKey(): string {
  return currentArticleUsageMonthKey();
}

function limitForKey(planKey: BillingPlanKey, key: UsageKey): number {
  const config = BILLING_PLANS[planKey];

  switch (key) {
    case "AUDIT_RUN":
      return config.monthlyAudits;
    case "AI_GENERATION":
      return config.monthlyAiGenerations;
    case "ARTICLE_DRAFT":
      return config.monthlyArticles;
    case "SOCIAL_POST":
      return config.monthlySocialPosts;
    case "MONTHLY_AUTOPILOT":
      return config.monthlyAutopilotPlans;
    case "EMAIL_APPROVAL":
      return config.emailApprovals;
    case "REPORT":
      return config.reports;
    default:
      return 0;
  }
}

async function getUsageCount(input: {
  organizationId: string;
  userId: string;
  key: UsageKey;
  month: string;
  websiteId?: string | null;
}): Promise<number> {
  // ARTICLE_DRAFT is live-derived from usable active drafts so archived /
  // quality-failed junk cannot permanently block generation. AI_GENERATION
  // remains the persisted attempt/cost counter.
  if (input.key === "ARTICLE_DRAFT") {
    return countActiveQuotaArticleDrafts({
      organizationId: input.organizationId,
      websiteId: null,
      month: input.month,
    });
  }

  const prisma = getPrisma();

  const counter = await prisma.usageCounter.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      month: input.month,
      key: input.key,
    },
    select: { count: true },
  });

  if (counter) {
    return counter.count;
  }

  const subscription = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  const planLimit = subscription.planLimit;
  if (!planLimit) {
    return 0;
  }

  switch (input.key) {
    case "AUDIT_RUN":
      return planLimit.auditsUsed;
    case "SOCIAL_POST":
      return planLimit.socialPostsUsed;
    default:
      return 0;
  }
}

export async function checkUsageLimit(input: {
  userId: string;
  organizationId: string;
  websiteId?: string | null;
  key: UsageKey;
}) {
  const subscription = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  const planKey = normalizeBillingPlan(subscription.subscription.plan);
  const month = currentMonthKey();
  const limit = limitForKey(planKey, input.key);
  const current = await getUsageCount({
    organizationId: input.organizationId,
    userId: input.userId,
    key: input.key,
    month,
    websiteId: input.websiteId,
  });

  return {
    allowed: limit <= 0 ? false : current < limit,
    current,
    limit,
    plan: planKey,
  };
}

export async function incrementUsage(input: {
  userId: string;
  organizationId: string;
  websiteId?: string | null;
  key: UsageKey;
}) {
  const prisma = getPrisma();
  const month = currentMonthKey();

  // ARTICLE_DRAFT: snap persisted snapshots to the live usable-draft count
  // instead of blind +1 (archived junk must not accumulate forever).
  if (input.key === "ARTICLE_DRAFT") {
    const subscription = await getCurrentSubscription({
      userId: input.userId,
      organizationId: input.organizationId,
    });
    await reconcileArticleDraftUsage({
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      month,
      planLimitId: subscription.planLimit?.id ?? null,
    });
    return;
  }

  await prisma.usageCounter.upsert({
    where: {
      organizationId_userId_month_key: {
        organizationId: input.organizationId,
        userId: input.userId,
        month,
        key: input.key,
      },
    },
    create: {
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId ?? null,
      month,
      key: input.key,
      count: 1,
    },
    update: {
      count: { increment: 1 },
    },
  });

  const subscription = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  if (subscription.planLimit) {
    const data: Record<string, { increment: number }> = {};
    if (input.key === "AUDIT_RUN") {
      data.auditsUsed = { increment: 1 };
    } else if (input.key === "SOCIAL_POST") {
      data.socialPostsUsed = { increment: 1 };
    }
    // AI_GENERATION is cost/attempt protection only — do not bump articlesUsed.
    // articlesUsed tracks usable ARTICLE_DRAFT slots (live / reconciled).

    if (Object.keys(data).length > 0) {
      await prisma.planLimit.update({
        where: { id: subscription.planLimit.id },
        data,
      });
    }
  }
}

export async function syncPlanLimitsFromConfig(input: {
  organizationId: string;
  subscriptionId: string;
  planKey: BillingPlanKey;
}) {
  const prisma = getPrisma();
  const { start, end } = monthPeriod();
  const config = BILLING_PLANS[input.planKey];

  const existing = await prisma.planLimit.findFirst({
    where: {
      subscriptionId: input.subscriptionId,
      organizationId: input.organizationId,
      periodStart: start,
    },
  });

  const limits = {
    auditsLimit: config.monthlyAudits,
    articlesLimit: config.monthlyArticles,
    socialPostsLimit: config.monthlySocialPosts,
    websitesLimit: config.websites,
    aiCreditsLimitCents: config.monthlyAiGenerations * 100,
  };

  if (existing) {
    return prisma.planLimit.update({
      where: { id: existing.id },
      data: limits,
    });
  }

  return prisma.planLimit.create({
    data: {
      subscriptionId: input.subscriptionId,
      organizationId: input.organizationId,
      periodStart: start,
      periodEnd: end,
      ...limits,
    },
  });
}

export async function getUsageSummary(input: {
  userId: string;
  organizationId: string;
}): Promise<UsageSummaryViewModel> {
  const subscription = await getCurrentSubscription({
    userId: input.userId,
    organizationId: input.organizationId,
  });

  const planKey = normalizeBillingPlan(subscription.subscription.plan);
  const month = currentMonthKey();
  const keys: UsageKey[] = [
    "AUDIT_RUN",
    "AI_GENERATION",
    "ARTICLE_DRAFT",
    "SOCIAL_POST",
    "MONTHLY_AUTOPILOT",
    "EMAIL_APPROVAL",
    "REPORT",
  ];

  const items = await Promise.all(
    keys.map(async (key) => ({
      key: key.toLowerCase(),
      label: USAGE_KEY_LABELS[key],
      current: await getUsageCount({
        organizationId: input.organizationId,
        userId: input.userId,
        key,
        month,
      }),
      limit: limitForKey(planKey, key),
    }))
  );

  return { month, items };
}
