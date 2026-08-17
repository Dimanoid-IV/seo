import "server-only";

import { AuditTriggeredBy, IntegrationProvider, IntegrationStatus, MonthlyAutopilotStatus } from "@prisma/client";

import { runAndPersistWebsiteAudit } from "@/lib/audit/persist-audit";
import { inferAndPersistBusinessProfile } from "@/lib/business-profile/persist";
import { runIncrementalCrawl } from "@/lib/crawler/run-incremental-crawl";
import { getPrisma } from "@/lib/db";
import { syncGscPerformanceForWebsite } from "@/lib/integrations/gsc-sync";
import { generateInternalLinkActions } from "@/lib/internal-linking/generate-actions";
import { measureDueActionImpacts } from "./measure-action-impacts";
import { runDueSafeActions } from "./run-due-safe-actions";

export type DailyMaintenanceReport = {
  websitesScanned: number;
  crawlsCompleted: number;
  auditsCompleted: number;
  profilesUpdated: number;
  gscSyncsCompleted: number;
  internalLinkActionsCreated: number;
  actionImpactsMeasured: number;
  improvementsPlanned: number;
  safeActionsApplied: number;
  errors: Array<{ websiteId: string; stage: string; code: string }>;
};

export async function runDueDailyMaintenance(input: { now?: Date; limit?: number } = {}): Promise<DailyMaintenanceReport> {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 25);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  await prisma.apiRateLimitBucket.deleteMany({ where: { expiresAt: { lt: dayAgo } } });
  const plans = await prisma.monthlyAutopilotPlan.findMany({
    where: {
      status: MonthlyAutopilotStatus.APPROVED,
      archivedAt: null,
      website: { status: "ACTIVE", deletedAt: null },
    },
    orderBy: { updatedAt: "asc" },
    distinct: ["websiteId"],
    take: limit,
    select: {
      userId: true,
      websiteId: true,
      website: {
        select: {
          lastAuditAt: true,
          businessProfile: { select: { lastInferredAt: true } },
          crawledPages: {
            where: { deletedAt: null, OR: [{ nextCrawlAt: null }, { nextCrawlAt: { lte: now } }] },
            take: 1,
            select: { id: true },
          },
          _count: { select: { crawledPages: true } },
        },
      },
    },
  });
  const report: DailyMaintenanceReport = {
    websitesScanned: plans.length,
    crawlsCompleted: 0,
    auditsCompleted: 0,
    profilesUpdated: 0,
    gscSyncsCompleted: 0,
    internalLinkActionsCreated: 0,
    actionImpactsMeasured: 0,
    improvementsPlanned: 0,
    safeActionsApplied: 0,
    errors: [],
  };

  for (const plan of plans) {
    let crawled = false;
    try {
      if (!plan.website.lastAuditAt || plan.website.lastAuditAt < weekAgo) {
        await runAndPersistWebsiteAudit({
          websiteId: plan.websiteId,
          userId: plan.userId,
          trigger: AuditTriggeredBy.CRON,
        });
        report.auditsCompleted += 1;
        report.crawlsCompleted += 1;
        crawled = true;
      } else if (plan.website._count.crawledPages === 0 || plan.website.crawledPages.length > 0) {
        await runIncrementalCrawl({ websiteId: plan.websiteId, now, maxPages: 75 });
        report.crawlsCompleted += 1;
        crawled = true;
      }
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "crawl_audit", code: "maintenance_stage_failed" });
    }
    try {
      if (
        crawled ||
        !plan.website.businessProfile?.lastInferredAt ||
        plan.website.businessProfile.lastInferredAt < dayAgo
      ) {
        await inferAndPersistBusinessProfile(plan.websiteId);
        report.profilesUpdated += 1;
      }
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "business_profile", code: "maintenance_stage_failed" });
    }
    try {
      if (crawled) {
        report.internalLinkActionsCreated += await generateInternalLinkActions(plan.websiteId);
      }
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "internal_linking", code: "maintenance_stage_failed" });
    }
    try {
      const actions = await runDueSafeActions({ websiteId: plan.websiteId, now });
      report.safeActionsApplied += actions.applied;
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "safe_actions", code: "maintenance_stage_failed" });
    }
    try {
      const gsc = await prisma.integration.findFirst({
        where: {
          websiteId: plan.websiteId,
          provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
          status: IntegrationStatus.CONNECTED,
          OR: [{ lastSyncAt: null }, { lastSyncAt: { lt: dayAgo } }],
        },
        select: { id: true },
      });
      if (gsc) {
        await syncGscPerformanceForWebsite({ websiteId: plan.websiteId, userId: plan.userId });
        report.gscSyncsCompleted += 1;
      }
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "gsc_sync", code: "maintenance_stage_failed" });
    }
    try {
      const impact = await measureDueActionImpacts({ websiteId: plan.websiteId, now });
      report.actionImpactsMeasured += impact.measured;
      report.improvementsPlanned += impact.improvementsPlanned;
    } catch {
      report.errors.push({ websiteId: plan.websiteId, stage: "impact_measurement", code: "maintenance_stage_failed" });
    }
  }
  return report;
}
