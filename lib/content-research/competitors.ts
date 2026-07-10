import type { CompetitorInsight } from "./types";
import { extractDomainFromUrl, extractDomainsFromText } from "./normalize";

export type CompetitorDiscoveryInput = {
  websiteUrl: string;
  /** User-provided competitor domains from businessGoals or settings */
  manualCompetitors?: string[];
  /** Domains found in audit/task recommendation metadata */
  metadataDomains?: string[];
  gscConnected?: boolean;
};

export type CompetitorDiscoveryResult = {
  competitors: CompetitorInsight[];
  unavailable: boolean;
  placeholderReason?: string;
};

function domainToName(domain: string): string {
  const base = domain.split(".")[0] ?? domain;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function buildCompetitorInsight(domain: string, reason: string): CompetitorInsight {
  return {
    domain,
    name: domainToName(domain),
    reason,
    observedStrengths: [],
    contentAngles: [],
  };
}

/**
 * Safe baseline competitor discovery — no scraping or paid APIs.
 */
export function discoverCompetitors(
  input: CompetitorDiscoveryInput
): CompetitorDiscoveryResult {
  const ownDomain = extractDomainFromUrl(input.websiteUrl);
  const seen = new Set<string>();
  const competitors: CompetitorInsight[] = [];

  function addDomain(domain: string, reason: string) {
    const normalized = domain.toLowerCase().replace(/^www\./, "");
    if (!normalized || normalized === ownDomain || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    competitors.push(buildCompetitorInsight(normalized, reason));
  }

  for (const raw of input.manualCompetitors ?? []) {
    const domain = extractDomainFromUrl(raw) ?? raw.toLowerCase().replace(/^www\./, "");
    addDomain(domain, "Added as a known competitor for your business.");
  }

  for (const domain of input.metadataDomains ?? []) {
    addDomain(domain, "Referenced in audit or task recommendations.");
  }

  if (competitors.length === 0) {
    return {
      competitors: [],
      unavailable: true,
      placeholderReason: input.gscConnected
        ? "Competitors will be refined after Search Console query data and manual input."
        : "Competitors will be added after Search Console or manual competitor input is available.",
    };
  }

  return {
    competitors: competitors.slice(0, 8),
    unavailable: false,
  };
}

export function extractDomainsFromJson(value: unknown): string[] {
  if (!value) {
    return [];
  }

  const domains: string[] = [];

  if (typeof value === "string") {
    return extractDomainsFromText(value);
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;

  if (Array.isArray(record.competitors)) {
    for (const item of record.competitors) {
      if (typeof item === "string") {
        const d = extractDomainFromUrl(item) ?? item;
        domains.push(d);
      } else if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const url = obj.url ?? obj.domain ?? obj.name;
        if (typeof url === "string") {
          domains.push(extractDomainFromUrl(url) ?? url);
        }
      }
    }
  }

  if (typeof record.competitorUrl === "string") {
    domains.push(extractDomainFromUrl(record.competitorUrl) ?? record.competitorUrl);
  }

  const jsonText = JSON.stringify(record);
  domains.push(...extractDomainsFromText(jsonText));

  return [...new Set(domains.map((d) => d.toLowerCase().replace(/^www\./, "")))];
}

export function parseManualCompetitorsFromBusinessGoals(
  businessGoals: unknown
): string[] {
  if (!businessGoals || typeof businessGoals !== "object") {
    return [];
  }
  return extractDomainsFromJson(businessGoals);
}
