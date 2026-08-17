export type SemanticPage = {
  url: string;
  locale: string | null;
  pageType: string;
  title: string;
  headings: string[];
  bodyText: string;
  links: Array<{ url: string; anchor: string }>;
  indexable: boolean;
};

export type InternalLinkOpportunity = {
  sourceUrl: string;
  targetUrl: string;
  anchor: string;
  relevance: number;
  targetPriority: number;
  reason: string;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "your", "our",
  "для", "как", "что", "это", "или", "при", "его", "она", "они",
  "ning", "või", "see", "selle", "oma", "kuidas", "mis", "kas",
]);

function tokens(value: string): Set<string> {
  return new Set(
    value.toLocaleLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((word) => !STOP_WORDS.has(word)) ?? []
  );
}

function similarity(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / Math.sqrt(left.size * right.size);
}

function targetPriority(page: SemanticPage): number {
  if (page.pageType === "PRODUCT" || page.pageType === "SERVICE") return 100;
  if (page.pageType === "CATEGORY") return 75;
  if (page.pageType === "BLOG") return 50;
  return 30;
}

function anchorFor(page: SemanticPage): string {
  return (page.title || page.headings[0] || new URL(page.url).pathname.split("/").filter(Boolean).pop() || page.url)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/** Build bounded, locale-aware links without inventing relevance or repeating anchors. */
export function findInternalLinkOpportunities(
  pages: SemanticPage[],
  options: { maxInboundPerTarget?: number; maxOutboundPerSource?: number } = {}
): InternalLinkOpportunity[] {
  const active = pages.filter((page) => page.indexable);
  const inboundLimit = options.maxInboundPerTarget ?? 3;
  const outboundLimit = options.maxOutboundPerSource ?? 5;
  const candidates: InternalLinkOpportunity[] = [];

  for (const target of active) {
    const targetTokens = tokens(`${target.title} ${target.headings.join(" ")}`);
    for (const source of active) {
      if (source.url === target.url) continue;
      // Body-content adapters can safely place contextual links in articles;
      // navigation and landing-page edits remain review-only.
      if (source.pageType !== "BLOG") continue;
      if (source.locale && target.locale && source.locale !== target.locale) continue;
      if (source.links.some((link) => link.url === target.url)) continue;
      const relevance = similarity(targetTokens, tokens(`${source.title} ${source.headings.join(" ")} ${source.bodyText.slice(0, 6000)}`));
      if (relevance < 0.12) continue;
      candidates.push({
        sourceUrl: source.url,
        targetUrl: target.url,
        anchor: anchorFor(target),
        relevance: Math.round(relevance * 100),
        targetPriority: targetPriority(target),
        reason: `Semantic overlap ${Math.round(relevance * 100)}/100; target priority ${targetPriority(target)}/100.`,
      });
    }
  }

  candidates.sort((a, b) => (b.targetPriority + b.relevance) - (a.targetPriority + a.relevance));
  const inbound = new Map<string, number>();
  const outbound = new Map<string, number>();
  const anchors = new Map<string, number>();
  return candidates.filter((candidate) => {
    const anchorKey = candidate.anchor.toLocaleLowerCase();
    if ((inbound.get(candidate.targetUrl) ?? 0) >= inboundLimit) return false;
    if ((outbound.get(candidate.sourceUrl) ?? 0) >= outboundLimit) return false;
    if ((anchors.get(anchorKey) ?? 0) >= 2) return false;
    inbound.set(candidate.targetUrl, (inbound.get(candidate.targetUrl) ?? 0) + 1);
    outbound.set(candidate.sourceUrl, (outbound.get(candidate.sourceUrl) ?? 0) + 1);
    anchors.set(anchorKey, (anchors.get(anchorKey) ?? 0) + 1);
    return true;
  });
}
