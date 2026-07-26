import "server-only";

import { getPrisma } from "@/lib/db";

type OwnerRef = {
  website: {
    organization: {
      ownerUserId: string;
    };
  };
};

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

function percent(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 100);
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
  }
}

export type AdminGrowthDashboardData = Awaited<
  ReturnType<typeof getAdminGrowthDashboard>
>;

export async function getAdminGrowthDashboard(days: number) {
  const prisma = getPrisma();
  const safeDays = Math.min(Math.max(Math.floor(days) || 30, 1), 365);
  const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers,
    totalWebsites,
    newWebsites,
    totalCompletedAudits,
    completedAudits,
    failedAudits,
    websitesWithAudit,
    websiteOwners,
    auditOwners,
    recentWebsites,
    recentAudits,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    prisma.website.count({ where: { deletedAt: null } }),
    prisma.website.count({ where: { deletedAt: null, createdAt: { gte: since } } }),
    prisma.audit.count({
      where: { deletedAt: null, status: "COMPLETED" },
    }),
    prisma.audit.count({
      where: {
        deletedAt: null,
        status: "COMPLETED",
        completedAt: { gte: since },
      },
    }),
    prisma.audit.count({
      where: {
        deletedAt: null,
        status: "FAILED",
        OR: [{ failedAt: { gte: since } }, { createdAt: { gte: since } }],
      },
    }),
    prisma.audit.findMany({
      where: {
        deletedAt: null,
        status: "COMPLETED",
        completedAt: { gte: since },
      },
      distinct: ["websiteId"],
      select: { websiteId: true },
    }),
    prisma.website.findMany({
      where: { deletedAt: null, createdAt: { gte: since } },
      select: { organization: { select: { ownerUserId: true } } },
    }),
    prisma.audit.findMany({
      where: {
        deletedAt: null,
        status: "COMPLETED",
        completedAt: { gte: since },
      },
      select: {
        website: {
          select: {
            organization: { select: { ownerUserId: true } },
          },
        },
      },
    }),
    prisma.website.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        url: true,
        displayName: true,
        createdAt: true,
        lastAuditAt: true,
        currentGrowthScore: true,
        organization: { select: { name: true } },
      },
    }),
    prisma.audit.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        growthScore: true,
        createdAt: true,
        completedAt: true,
        failedAt: true,
        website: { select: { url: true, displayName: true } },
      },
    }),
  ]);

  const usersAddedWebsite = uniqueCount(
    websiteOwners.map((item) => item.organization.ownerUserId)
  );
  const usersCompletedAudit = uniqueCount(
    (auditOwners as OwnerRef[]).map(
      (item) => item.website.organization.ownerUserId
    )
  );

  return {
    days: safeDays,
    since: since.toISOString(),
    totals: {
      users: totalUsers,
      websites: totalWebsites,
      completedAudits: totalCompletedAudits,
    },
    period: {
      newUsers,
      newWebsites,
      usersAddedWebsite,
      usersCompletedAudit,
      completedAudits,
      failedAudits,
      auditedWebsites: websitesWithAudit.length,
      websiteToAuditConversion: percent(usersCompletedAudit, usersAddedWebsite),
      signupToWebsiteConversion: percent(usersAddedWebsite, newUsers),
      signupToAuditConversion: percent(usersCompletedAudit, newUsers),
    },
    recentWebsites: recentWebsites.map((website) => ({
      id: website.id,
      label: website.displayName ?? hostFromUrl(website.url),
      url: website.url,
      host: hostFromUrl(website.url),
      organizationName: website.organization.name,
      createdAt: website.createdAt.toISOString(),
      lastAuditAt: website.lastAuditAt?.toISOString() ?? null,
      currentGrowthScore: website.currentGrowthScore,
    })),
    recentAudits: recentAudits.map((audit) => ({
      id: audit.id,
      websiteLabel: audit.website.displayName ?? hostFromUrl(audit.website.url),
      websiteHost: hostFromUrl(audit.website.url),
      status: audit.status,
      growthScore: audit.growthScore,
      createdAt: audit.createdAt.toISOString(),
      completedAt: audit.completedAt?.toISOString() ?? null,
      failedAt: audit.failedAt?.toISOString() ?? null,
    })),
  };
}
