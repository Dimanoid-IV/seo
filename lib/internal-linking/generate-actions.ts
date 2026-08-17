import "server-only";

import { createHash } from "node:crypto";
import { ActionPolicyDecision, AutopilotActionState, Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { findInternalLinkOpportunities, type SemanticPage } from "./semantic-graph";

function records(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
}

function stableKey(websiteId: string, sourceUrl: string, targetUrl: string): string {
  const digest = createHash("sha256").update(`${sourceUrl}\n${targetUrl}`).digest("hex").slice(0, 32);
  return `internal-link:${websiteId}:${digest}`;
}

export async function generateInternalLinkActions(websiteId: string): Promise<number> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    select: {
      organizationId: true,
      crawledPages: {
        where: { deletedAt: null, indexable: true },
        take: 500,
        include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
      },
    },
  });
  if (!website) return 0;

  const pages: SemanticPage[] = website.crawledPages.flatMap((page) => {
    const snapshot = page.snapshots[0];
    if (!snapshot) return [];
    const headings = records(snapshot.headingsJson)
      .map((heading) => typeof heading.text === "string" ? heading.text : "")
      .filter(Boolean);
    const links = records(snapshot.internalLinkDetailsJson).flatMap((link) =>
      typeof link.url === "string"
        ? [{ url: link.url, anchor: typeof link.anchor === "string" ? link.anchor : "" }]
        : []
    );
    return [{
      url: page.normalizedUrl,
      locale: page.locale,
      pageType: page.pageType,
      title: snapshot.title ?? "",
      headings,
      bodyText: snapshot.bodyText ?? "",
      links,
      indexable: snapshot.indexable,
    }];
  });

  const opportunities = findInternalLinkOpportunities(pages).slice(0, 50);
  if (!opportunities.length) return 0;
  const result = await prisma.autopilotAction.createMany({
    data: opportunities.map((opportunity) => ({
      websiteId,
      organizationId: website.organizationId,
      actionType: "INTERNAL_LINKS",
      policy: ActionPolicyDecision.SAFE_AUTO,
      state: AutopilotActionState.PLANNED,
      title: `Add contextual link to ${opportunity.anchor}`,
      reason: opportunity.reason,
      targetUrl: opportunity.sourceUrl,
      priority: Math.min(100, Math.round((opportunity.relevance + opportunity.targetPriority) / 2)),
      expectedImpact: opportunity.targetPriority / 100,
      confidence: opportunity.relevance / 100,
      reversible: true,
      evidenceJson: {
        sourceUrl: opportunity.sourceUrl,
        targetUrl: opportunity.targetUrl,
        anchor: opportunity.anchor,
        observedExistingLink: false,
      } as Prisma.InputJsonValue,
      scheduledAt: new Date(),
      idempotencyKey: stableKey(websiteId, opportunity.sourceUrl, opportunity.targetUrl),
    })),
    skipDuplicates: true,
  });
  return result.count;
}
