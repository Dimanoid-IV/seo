import "server-only";

import type { SearchIntent as PrismaSearchIntent } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import type { ContentResearchBrief } from "./types";

/** Store the evidence-backed brief separately from mutable monthly-plan JSON. */
export async function persistContentResearchBrief(
  brief: ContentResearchBrief
): Promise<string> {
  const evidenceConfidence = brief.seoStrategy?.confidence === "HIGH"
    ? 0.85
    : brief.seoStrategy?.confidence === "MEDIUM"
      ? 0.65
      : brief.evidence.length > 0
        ? 0.45
        : 0.2;

  const record = await getPrisma().contentBrief.create({
    data: {
      websiteId: brief.websiteId,
      organizationId: brief.organizationId,
      primaryKeyword: brief.primaryKeyword,
      secondaryKeywordsJson: brief.secondaryKeywords,
      locale: brief.seoStrategy?.locale ?? "und",
      intent: brief.searchIntent as PrismaSearchIntent,
      requiredSectionsJson: brief.outline,
      questionsJson: brief.faq,
      entitiesJson: brief.serpResearch?.entities ?? [],
      competitorGapsJson: brief.competitors.flatMap((item) => item.contentAngles),
      internalLinksJson: brief.internalLinkSuggestions,
      sourcesJson: brief.evidence,
      conversionGoal: brief.buyerQuestion || null,
      evidenceConfidence,
      researchedAt: new Date(brief.generatedAt),
    },
    select: { id: true },
  });
  return record.id;
}
