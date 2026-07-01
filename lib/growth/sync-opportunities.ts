import { ActivityType } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import { findGrowthOpportunities } from "./opportunities";
import type { GrowthOpportunity } from "./types";

function extractKnownOpportunityIds(
  activities: Array<{ metadataJson: unknown }>
): Set<string> {
  const knownIds = new Set<string>();

  for (const activity of activities) {
    const metadata = activity.metadataJson as { opportunityId?: string } | null;
    if (metadata?.opportunityId) {
      knownIds.add(metadata.opportunityId);
    }
  }

  return knownIds;
}

/**
 * Persists Activity rows for newly discovered opportunities (deduped by stable id).
 */
export async function recordNewGrowthOpportunityActivities(input: {
  websiteId: string;
  organizationId: string;
  userId?: string | null;
  opportunities?: GrowthOpportunity[];
}): Promise<number> {
  const prisma = getPrisma();
  const opportunities =
    input.opportunities ?? (await findGrowthOpportunities(input.websiteId));

  if (opportunities.length === 0) {
    return 0;
  }

  const existingActivities = await prisma.activity.findMany({
    where: {
      websiteId: input.websiteId,
      type: ActivityType.GROWTH_OPPORTUNITY_FOUND,
    },
    select: { metadataJson: true },
  });

  const knownIds = extractKnownOpportunityIds(existingActivities);
  const newOpportunities = opportunities.filter(
    (opportunity) => !knownIds.has(opportunity.id)
  );

  if (newOpportunities.length === 0) {
    return 0;
  }

  await prisma.activity.createMany({
    data: newOpportunities.map((opportunity) => ({
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      userId: input.userId ?? null,
      type: ActivityType.GROWTH_OPPORTUNITY_FOUND,
      title: opportunity.title,
      description: opportunity.description,
      metadataJson: {
        opportunityId: opportunity.id,
        opportunityType: opportunity.type,
        estimatedImpact: opportunity.estimatedImpact,
        estimatedEffort: opportunity.estimatedEffort,
        createdFrom: opportunity.createdFrom,
      },
    })),
  });

  return newOpportunities.length;
}

/**
 * Finds opportunities and records Activity for any newly discovered ones.
 */
export async function syncGrowthOpportunitiesForWebsite(input: {
  websiteId: string;
  organizationId: string;
  userId?: string | null;
}): Promise<GrowthOpportunity[]> {
  const opportunities = await findGrowthOpportunities(input.websiteId);

  await recordNewGrowthOpportunityActivities({
    ...input,
    opportunities,
  });

  return opportunities;
}
