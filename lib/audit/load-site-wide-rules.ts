import "server-only";

import { getPrisma } from "@/lib/db";

import { runSiteWideAuditRules, type SiteWidePageFact } from "./site-wide-rules";

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

function schemaTypes(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const type = record["@type"];
    if (typeof type === "string") found.add(type);
    else if (Array.isArray(type)) type.filter((item): item is string => typeof item === "string").forEach((item) => found.add(item));
    Object.values(record).forEach(visit);
  };
  visit(value);
  return [...found];
}

export async function loadSiteWideAuditRules(websiteId: string) {
  const prisma = getPrisma();
  const rows = await prisma.crawledPage.findMany({
    where: { websiteId, deletedAt: null },
    include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
    take: 500,
  });
  const facts: SiteWidePageFact[] = rows.map((page) => {
    const snapshot = page.snapshots[0];
    const headings = records(snapshot?.headingsJson);
    const images = records(snapshot?.imagesJson);
    const internalLinks = Array.isArray(snapshot?.internalLinksJson)
      ? snapshot.internalLinksJson.filter((item): item is string => typeof item === "string")
      : [];
    return {
      url: page.normalizedUrl,
      title: snapshot?.title ?? null,
      metaDescription: snapshot?.metaDescription ?? null,
      h1Count: headings.filter((heading) => heading.level === 1).length,
      wordCount: snapshot?.wordCount ?? 0,
      pageType: page.pageType,
      canonicalUrl: snapshot?.canonicalUrl ?? page.canonicalUrl,
      indexable: snapshot?.indexable ?? page.indexable ?? false,
      inSitemap: page.inSitemap,
      crawlDepth: page.crawlDepth,
      contentHash: snapshot?.contentHash ?? page.contentHash,
      internalLinks,
      missingAlt: images.filter((image) => typeof image.alt !== "string" || !image.alt.trim()).length,
      schemaTypes: schemaTypes(snapshot?.schemaJson),
      hreflangCount: records(snapshot?.hreflangJson).length,
      redirectTarget: page.redirectTarget,
      failed: page.consecutiveFailures > 0 && !snapshot,
    };
  });
  return runSiteWideAuditRules(facts);
}
