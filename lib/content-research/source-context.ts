import "server-only";

import {
  ArticleStatus,
  AuditCheckSeverity,
  AuditCheckStatus,
  AuditStatus,
  IntegrationProvider,
  IntegrationStatus,
  TaskCategory,
  TaskStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { extractGscMetricsSummary } from "@/lib/integrations/gsc-metrics";
import { generateGscInsights } from "@/lib/integrations/gsc-insights";
import { sortGrowthOpportunities } from "@/lib/growth/opportunities";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";

import {
  discoverCompetitors,
  extractDomainsFromJson,
  parseManualCompetitorsFromBusinessGoals,
} from "./competitors";

export type ResearchSourceContext = {
  website: {
    id: string;
    url: string;
    displayName: string | null;
    niche: string | null;
    primaryLanguage: string;
    businessGoals: unknown;
  };
  organizationId: string;
  gscConnected: boolean;
  gscInsightTitles: string[];
  opportunities: Array<{
    title: string;
    description: string;
    type: string;
  }>;
  contentTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    recommendationJson: unknown;
  }>;
  auditFindings: Array<{ id: string; title: string; recommendationJson: unknown }>;
  articles: Array<{
    id: string;
    title: string;
    topic: string | null;
    targetKeyword: string | null;
  }>;
  metadataDomains: string[];
  focusAreaTitles: string[];
};

export async function loadResearchSourceContext(input: {
  websiteId: string;
  organizationId: string;
  userId: string;
  focusAreaTitles?: string[];
}): Promise<ResearchSourceContext> {
  const prisma = getPrisma();

  const website = await prisma.website.findFirstOrThrow({
    where: { id: input.websiteId, deletedAt: null },
    select: {
      id: true,
      url: true,
      displayName: true,
      niche: true,
      primaryLanguage: true,
      businessGoals: true,
    },
  });

  const [
    gscIntegration,
    contentTasks,
    latestAudit,
    articles,
    opportunities,
  ] = await Promise.all([
    prisma.integration.findFirst({
      where: {
        websiteId: input.websiteId,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
        status: IntegrationStatus.CONNECTED,
      },
      select: {
        googleData: { select: { metricsJson: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        websiteId: input.websiteId,
        deletedAt: null,
        status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        category: TaskCategory.CONTENT,
      },
      select: {
        id: true,
        title: true,
        description: true,
        recommendationJson: true,
      },
      take: 30,
    }),
    prisma.audit.findFirst({
      where: {
        websiteId: input.websiteId,
        status: AuditStatus.COMPLETED,
        deletedAt: null,
      },
      orderBy: { completedAt: "desc" },
      select: {
        checks: {
          where: {
            severity: {
              in: [AuditCheckSeverity.CRITICAL, AuditCheckSeverity.HIGH],
            },
            status: {
              in: [AuditCheckStatus.FAIL, AuditCheckStatus.WARNING],
            },
          },
          select: {
            id: true,
            title: true,
            recommendationJson: true,
          },
          take: 15,
        },
      },
    }),
    prisma.article.findMany({
      where: {
        websiteId: input.websiteId,
        deletedAt: null,
        status: {
          in: [
            ArticleStatus.IDEA,
            ArticleStatus.DRAFT,
            ArticleStatus.WAITING_REVIEW,
          ],
        },
      },
      select: {
        id: true,
        title: true,
        topic: true,
        targetKeyword: true,
      },
      take: 20,
    }),
    syncGrowthOpportunitiesForWebsite({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      userId: input.userId,
    }).then(sortGrowthOpportunities),
  ]);

  const gscConnected = Boolean(gscIntegration);
  const gscSummary = gscConnected
    ? extractGscMetricsSummary(gscIntegration?.googleData?.metricsJson)
    : null;
  const gscInsights = gscSummary ? generateGscInsights(gscSummary) : [];

  const metadataDomains: string[] = [];

  for (const task of contentTasks) {
    metadataDomains.push(...extractDomainsFromJson(task.recommendationJson));
  }

  for (const check of latestAudit?.checks ?? []) {
    metadataDomains.push(...extractDomainsFromJson(check.recommendationJson));
  }

  return {
    website: {
      id: website.id,
      url: website.url,
      displayName: website.displayName,
      niche: website.niche,
      primaryLanguage: website.primaryLanguage,
      businessGoals: website.businessGoals,
    },
    organizationId: input.organizationId,
    gscConnected,
    gscInsightTitles: gscInsights.map((i) => i.title),
    opportunities: opportunities.map((o) => ({
      title: o.title,
      description: o.description,
      type: o.type,
    })),
    contentTasks,
    auditFindings: latestAudit?.checks ?? [],
    articles,
    metadataDomains: [...new Set(metadataDomains)],
    focusAreaTitles: input.focusAreaTitles ?? [],
  };
}

export function resolveCompetitorsFromContext(
  context: ResearchSourceContext
): ReturnType<typeof discoverCompetitors> {
  const manualCompetitors = parseManualCompetitorsFromBusinessGoals(
    context.website.businessGoals
  );

  return discoverCompetitors({
    websiteUrl: context.website.url,
    manualCompetitors,
    metadataDomains: context.metadataDomains,
    gscConnected: context.gscConnected,
  });
}

export function localeFromWebsiteLanguage(
  language: string
): "en" | "ru" | "et" {
  const upper = language.toUpperCase();
  if (upper === "ET") return "et";
  if (upper === "EN") return "en";
  return "ru";
}
