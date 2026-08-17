import "server-only";

import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { readBrandVoiceFromBusinessGoals } from "@/lib/brand-voice/business-goals";

import { inferBusinessProfile, type BusinessPageEvidence } from "./infer";

function rows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

export async function inferAndPersistBusinessProfile(websiteId: string) {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    include: {
      organization: { select: { country: true } },
      crawledPages: {
        where: { deletedAt: null },
        include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
        orderBy: [{ crawlDepth: "asc" }, { lastCrawledAt: "desc" }],
        take: 200,
      },
    },
  });
  if (!website) throw new Error("website_not_found");
  const pages: BusinessPageEvidence[] = website.crawledPages.map((page) => {
    const snapshot = page.snapshots[0];
    const headings = rows(snapshot?.headingsJson);
    return {
      url: page.normalizedUrl,
      pageType: page.pageType,
      title: snapshot?.title ?? null,
      description: snapshot?.metaDescription ?? null,
      h1: typeof headings.find((heading) => heading.level === 1)?.text === "string"
        ? String(headings.find((heading) => heading.level === 1)?.text)
        : null,
      locale: page.locale,
      schema: snapshot?.schemaJson ?? [],
    };
  });
  const inferred = inferBusinessProfile({
    siteUrl: website.url,
    displayName: website.displayName,
    configuredCountry: website.organization.country,
    configuredNiche: website.niche,
    primaryLanguage: website.primaryLanguage,
    pages,
  });
  const brandVoice = readBrandVoiceFromBusinessGoals(website.businessGoals);
  const data = {
    organizationId: website.organizationId,
    businessName: inferred.businessName,
    description: inferred.description,
    niche: inferred.niche,
    country: inferred.country,
    targetMarketsJson: inferred.targetMarkets as Prisma.InputJsonValue,
    languagesJson: inferred.languages as Prisma.InputJsonValue,
    servicesJson: inferred.services as Prisma.InputJsonValue,
    productsJson: inferred.products as Prisma.InputJsonValue,
    targetAudiencesJson: brandVoice?.audience ? [brandVoice.audience] : [],
    conversionPagesJson: inferred.conversionPages as Prisma.InputJsonValue,
    commercialIntent: inferred.commercialIntent,
    toneOfVoiceJson: brandVoice ? (brandVoice as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    evidenceJson: inferred.evidence as Prisma.InputJsonValue,
    confidence: inferred.confidence,
    lastInferredAt: new Date(),
  };
  return prisma.businessProfile.upsert({
    where: { websiteId },
    create: { websiteId, ...data },
    update: data,
  });
}
