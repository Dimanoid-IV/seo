import "server-only";

import {
  AuditStatus,
  IntegrationProvider,
  IntegrationStatus,
  TaskStatus,
  WebsiteStatus,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";

import type { OnboardingFacts } from "./types";

export async function resolveOnboardingFacts(userId: string): Promise<OnboardingFacts> {
  const prisma = getPrisma();

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { onboardingCompletedAt: true },
  });

  const organization = await findPrimaryOrganization(prisma, userId);

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
        },
      })
    : null;

  const completedAudit = website
    ? await prisma.audit.findFirst({
        where: {
          websiteId: website.id,
          status: AuditStatus.COMPLETED,
          deletedAt: null,
        },
        select: { id: true },
      })
    : null;

  const gscIntegration = website
    ? await prisma.integration.findFirst({
        where: {
          websiteId: website.id,
          provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
          status: IntegrationStatus.CONNECTED,
        },
        select: { id: true },
      })
    : null;

  const openTasksCount = website
    ? await prisma.task.count({
        where: {
          websiteId: website.id,
          deletedAt: null,
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
      })
    : 0;

  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const monthlyPlan = website
    ? await prisma.monthlyAutopilotPlan.findUnique({
        where: {
          websiteId_month: {
            websiteId: website.id,
            month,
          },
        },
        select: { status: true },
      })
    : null;

  const onboardingState = await prisma.onboardingState.findUnique({
    where: { userId },
    select: {
      metadata: true,
      growthScoreViewedAt: true,
      firstTasksViewedAt: true,
    },
  });

  const metadata = onboardingState?.metadata as { gscSkipped?: boolean } | null;
  const gscSkipped = Boolean(metadata?.gscSkipped);
  const resultsViewed = Boolean(
    onboardingState?.growthScoreViewedAt || onboardingState?.firstTasksViewedAt
  );

  return {
    userId,
    organizationId: organization?.id ?? null,
    onboardingCompletedAt: user?.onboardingCompletedAt ?? null,
    website,
    hasCompletedAudit: Boolean(completedAudit),
    gscConnected: Boolean(gscIntegration),
    gscSkipped,
    resultsViewed,
    openTasksCount,
    opportunitiesCount: 0,
    hasMonthlyPlan: Boolean(monthlyPlan),
    monthlyPlanStatus: monthlyPlan?.status.toLowerCase() ?? null,
  };
}

export function isLegacyOnboardingComplete(facts: OnboardingFacts): boolean {
  return Boolean(facts.onboardingCompletedAt);
}
