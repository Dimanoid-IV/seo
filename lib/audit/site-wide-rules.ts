import {
  AuditRuleCategory,
  AuditRuleSeverity,
  AuditRuleStatus,
  type AuditRuleResult,
} from "./rules-types";

export type SiteWidePageFact = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1Count: number;
  wordCount: number;
  pageType: string;
  canonicalUrl: string | null;
  indexable: boolean;
  inSitemap: boolean;
  crawlDepth: number | null;
  contentHash: string | null;
  internalLinks: string[];
  missingAlt: number;
  schemaTypes: string[];
  hreflangCount: number;
  redirectTarget: string | null;
  failed: boolean;
};

type Finding = {
  code: string;
  category: keyof typeof AuditRuleCategory;
  severity: keyof typeof AuditRuleSeverity;
  title: string;
  description: string;
  recommendation: string;
  urls: string[];
  count?: number;
};

function result(finding: Finding): AuditRuleResult {
  const count = finding.count ?? finding.urls.length;
  return {
    code: finding.code,
    category: AuditRuleCategory[finding.category],
    severity: AuditRuleSeverity[finding.severity],
    status: count > 0 ? AuditRuleStatus.FAIL : AuditRuleStatus.PASS,
    title: finding.title,
    description: finding.description,
    whyItMatters: finding.description,
    recommendation: finding.recommendation,
    scoreImpact: count > 0 ? Math.min(count, finding.severity === "HIGH" ? 8 : 5) : 0,
    evidence: { count, urls: finding.urls.slice(0, 50) },
    isVisibleInPreview: false,
    estimatedFixMinutes: count > 0 ? Math.min(count * 15, 480) : 0,
  };
}

function duplicateUrls(pages: SiteWidePageFact[], field: "title" | "metaDescription" | "contentHash"): string[] {
  const values = new Map<string, string[]>();
  for (const page of pages) {
    const value = page[field]?.trim().toLowerCase();
    if (!value) continue;
    values.set(value, [...(values.get(value) ?? []), page.url]);
  }
  return [...values.values()].filter((urls) => urls.length > 1).flat();
}

export function runSiteWideAuditRules(pages: SiteWidePageFact[]): AuditRuleResult[] {
  if (pages.length === 0) return [];
  const indexable = pages.filter((page) => page.indexable && !page.failed);
  const linkedTargets = new Set(pages.flatMap((page) => page.internalLinks));
  const pageByUrl = new Map(pages.map((page) => [page.url, page]));
  const redirectChains = pages.filter((page) => {
    if (!page.redirectTarget) return false;
    return Boolean(pageByUrl.get(page.redirectTarget)?.redirectTarget);
  });
  const brokenTargets = pages.filter((page) => page.failed && linkedTargets.has(page.url));
  const schemaMissing = indexable.filter(
    (page) => ["BLOG", "PRODUCT", "SERVICE"].includes(page.pageType) && page.schemaTypes.length === 0
  );

  const findings: Finding[] = [
    { code: "SITE_MISSING_TITLES", category: "TECHNICAL", severity: "HIGH", title: "Pages are missing titles", description: "Indexable pages without unique titles provide weak search-result context.", recommendation: "Write a specific title for every affected page.", urls: indexable.filter((page) => !page.title).map((page) => page.url) },
    { code: "SITE_DUPLICATE_TITLES", category: "TECHNICAL", severity: "HIGH", title: "Duplicate page titles", description: "Multiple indexable pages use the same title and compete for the same interpretation.", recommendation: "Differentiate each title around its page intent or consolidate duplicates.", urls: duplicateUrls(indexable, "title") },
    { code: "SITE_MISSING_DESCRIPTIONS", category: "TECHNICAL", severity: "MEDIUM", title: "Pages are missing meta descriptions", description: "Search snippets lack page-specific messaging.", recommendation: "Add concise, truthful descriptions aligned with each page intent.", urls: indexable.filter((page) => !page.metaDescription).map((page) => page.url) },
    { code: "SITE_DUPLICATE_DESCRIPTIONS", category: "TECHNICAL", severity: "MEDIUM", title: "Duplicate meta descriptions", description: "Repeated descriptions make pages harder to distinguish in search results.", recommendation: "Create distinct descriptions or merge overlapping pages.", urls: duplicateUrls(indexable, "metaDescription") },
    { code: "SITE_H1_ISSUES", category: "TECHNICAL", severity: "MEDIUM", title: "Missing or multiple H1 headings", description: "Each indexable page should have one clear primary heading.", recommendation: "Keep one descriptive H1 and demote supporting headings to H2-H6.", urls: indexable.filter((page) => page.h1Count !== 1).map((page) => page.url) },
    { code: "SITE_THIN_CONTENT", category: "CONTENT", severity: "MEDIUM", title: "Thin content on important pages", description: "Important content pages do not explain the topic sufficiently.", recommendation: "Improve the existing page with useful, evidence-backed sections instead of creating a competing URL.", urls: indexable.filter((page) => ["BLOG", "PRODUCT", "SERVICE"].includes(page.pageType) && page.wordCount < 300).map((page) => page.url) },
    { code: "SITE_BROKEN_INTERNAL_LINKS", category: "TECHNICAL", severity: "HIGH", title: "Broken internal links", description: "Internal links lead users and crawlers to failed pages.", recommendation: "Repair the link target or update/remove the source link.", urls: brokenTargets.map((page) => page.url) },
    { code: "SITE_ORPHAN_PAGES", category: "CONTENT", severity: "MEDIUM", title: "Orphan pages", description: "Sitemap pages without internal links receive little contextual authority.", recommendation: "Add relevant, varied internal links from appropriate hub or content pages.", urls: indexable.filter((page) => page.inSitemap && page.pageType !== "HOME" && !linkedTargets.has(page.url)).map((page) => page.url) },
    { code: "SITE_REDIRECT_CHAINS", category: "TECHNICAL", severity: "MEDIUM", title: "Redirect chains", description: "Multi-hop redirects waste crawl time and slow navigation.", recommendation: "Point links and redirects directly to the final canonical URL.", urls: redirectChains.map((page) => page.url) },
    { code: "SITE_CANONICAL_ISSUES", category: "TECHNICAL", severity: "HIGH", title: "Canonical problems", description: "Indexable pages have a missing or conflicting canonical URL.", recommendation: "Set one absolute self-referencing canonical unless intentional consolidation is documented.", urls: indexable.filter((page) => !page.canonicalUrl || page.canonicalUrl !== page.url).map((page) => page.url) },
    { code: "SITE_NOINDEX_IN_SITEMAP", category: "TECHNICAL", severity: "HIGH", title: "Noindex URLs in sitemap", description: "The sitemap asks crawlers to discover URLs that the page prevents from indexing.", recommendation: "Remove the URL from sitemap or remove noindex when indexing is intended.", urls: pages.filter((page) => page.inSitemap && !page.indexable).map((page) => page.url) },
    { code: "SITE_INDEXABLE_NOT_IN_SITEMAP", category: "TECHNICAL", severity: "MEDIUM", title: "Indexable pages missing from sitemap", description: "Important indexable URLs are not declared in the sitemap.", recommendation: "Add canonical indexable pages to the generated sitemap.", urls: indexable.filter((page) => !page.inSitemap).map((page) => page.url) },
    { code: "SITE_IMAGE_ALT", category: "ACCESSIBILITY", severity: "LOW", title: "Images missing alt text", description: "Meaningful images without alt text lose accessibility and context.", recommendation: "Add concise descriptive alt text; keep decorative images empty.", urls: indexable.filter((page) => page.missingAlt > 0).map((page) => page.url) },
    { code: "SITE_DUPLICATE_CONTENT", category: "CONTENT", severity: "HIGH", title: "Duplicate page content", description: "Multiple URLs contain materially identical page content.", recommendation: "Choose a primary page and merge, redirect, or canonicalize true duplicates.", urls: duplicateUrls(indexable, "contentHash") },
    { code: "SITE_DEEP_PAGES", category: "CONTENT", severity: "LOW", title: "Important pages are too deep", description: "Pages more than three clicks from the homepage receive weaker discovery and internal authority.", recommendation: "Link important pages from relevant hubs or navigation paths.", urls: indexable.filter((page) => (page.crawlDepth ?? 0) > 3).map((page) => page.url) },
    { code: "SITE_SCHEMA_MISSING", category: "AI_READINESS", severity: "LOW", title: "Relevant structured data is missing", description: "Content, product, or service pages lack machine-readable entity context.", recommendation: "Add accurate schema that matches visible content; do not add unsupported claims.", urls: schemaMissing.map((page) => page.url) },
  ];
  return findings.map(result);
}
