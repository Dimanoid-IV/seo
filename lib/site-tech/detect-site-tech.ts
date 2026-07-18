/**
 * Pure, dependency-free website technology detection.
 *
 * Takes an already-fetched HTML body + response headers (and optionally the
 * final URL) and infers which CMS / site builder the site is likely running on.
 * Kept free of `server-only` and network access so it can be unit tested and
 * reused from any layer.
 */

export type SiteTechPlatform =
  | "wordpress"
  | "shopify"
  | "webflow"
  | "wix"
  | "tilda"
  | "unknown";

/**
 * How RankBoost should offer publishing for a detected platform.
 * - `wordpress`: native WordPress integration is available.
 * - `universal`: no native integration yet — offer the Universal Publishing path.
 */
export type RecommendedPublishing = "wordpress" | "universal";

export interface SiteTechProbeInput {
  /** Raw HTML of the homepage (or any representative page). */
  html?: string | null;
  /** Response headers with lower-cased keys (as returned by fetchHtmlPage). */
  headers?: Record<string, string> | null;
  /** Final URL after redirects, used only for host-based hints. */
  url?: string | null;
}

export interface SiteTechCandidate {
  platform: Exclude<SiteTechPlatform, "unknown">;
  /** 0..1 confidence for this candidate. */
  confidence: number;
  /** Human-readable signal keys that matched. */
  signals: string[];
}

export interface SiteTechDetection {
  platform: SiteTechPlatform;
  /** 0..1 confidence in the chosen platform (0 for unknown). */
  confidence: number;
  /** Signals that matched for the chosen platform. */
  signals: string[];
  /** All platforms that matched at least one signal, strongest first. */
  candidates: SiteTechCandidate[];
  /** True when the detected platform has a native RankBoost publish path. */
  canPublishNatively: boolean;
  /** Which publishing path RankBoost should recommend. */
  recommendedPublishing: RecommendedPublishing;
}

interface Signal {
  key: string;
  /** Relative weight; strong fingerprints get higher weights. */
  weight: number;
  test: (ctx: NormalizedProbe) => boolean;
}

interface NormalizedProbe {
  html: string;
  headers: Record<string, string>;
  host: string;
}

/** Minimum aggregate score required to commit to a platform (else `unknown`). */
const MIN_CONFIDENCE = 0.35;

const PLATFORM_SIGNALS: Record<Exclude<SiteTechPlatform, "unknown">, Signal[]> = {
  wordpress: [
    { key: "wp-content", weight: 0.6, test: (c) => c.html.includes("/wp-content/") },
    { key: "wp-includes", weight: 0.5, test: (c) => c.html.includes("/wp-includes/") },
    {
      key: "wp-json",
      weight: 0.6,
      test: (c) =>
        c.html.includes("/wp-json") ||
        c.html.includes("api.w.org") ||
        headerIncludes(c.headers, "link", "wp-json"),
    },
    { key: "generator-meta", weight: 0.7, test: (c) => generatorMatches(c.html, "wordpress") },
    { key: "x-pingback-header", weight: 0.5, test: (c) => Boolean(c.headers["x-pingback"]) },
  ],
  shopify: [
    { key: "cdn-shopify", weight: 0.6, test: (c) => c.html.includes("cdn.shopify.com") },
    { key: "cdn-shop-path", weight: 0.4, test: (c) => c.html.includes("/cdn/shop/") },
    { key: "shopify-theme-js", weight: 0.6, test: (c) => /Shopify\.theme/.test(c.html) },
    {
      key: "shopify-headers",
      weight: 0.7,
      test: (c) =>
        Boolean(c.headers["x-shopid"]) ||
        Boolean(c.headers["x-shopify-stage"]) ||
        Boolean(c.headers["x-sorting-hat-shopid"]) ||
        headerIncludes(c.headers, "powered-by", "shopify"),
    },
  ],
  webflow: [
    {
      key: "webflow-js",
      weight: 0.6,
      test: (c) =>
        c.html.includes("webflow.js") ||
        c.html.includes("assets.website-files.com") ||
        c.html.includes("assets-global.website-files.com"),
    },
    { key: "data-wf-domain", weight: 0.7, test: (c) => /data-wf-(domain|page|site)/.test(c.html) },
    { key: "generator-meta", weight: 0.7, test: (c) => generatorMatches(c.html, "webflow") },
  ],
  wix: [
    { key: "wixstatic", weight: 0.6, test: (c) => c.html.includes("wixstatic.com") },
    { key: "wix-static-host", weight: 0.5, test: (c) => c.html.includes("static.parastorage.com") },
    {
      key: "wix-headers",
      weight: 0.6,
      test: (c) =>
        Boolean(c.headers["x-wix-request-id"]) || headerHasKeyPrefix(c.headers, "x-wix-"),
    },
    { key: "generator-meta", weight: 0.7, test: (c) => generatorMatches(c.html, "wix.com") },
  ],
  tilda: [
    {
      key: "tildacdn",
      weight: 0.6,
      test: (c) => c.html.includes("tildacdn.com") || c.html.includes("tildacdn.net"),
    },
    { key: "tilda-cc", weight: 0.25, test: (c) => c.html.includes("tilda.cc") },
    {
      key: "tilda-assets",
      weight: 0.5,
      test: (c) => /tilda(-blocks|newforms|-scripts|-grid|-slds|-menu)/.test(c.html),
    },
    { key: "generator-meta", weight: 0.7, test: (c) => generatorMatches(c.html, "tilda") },
  ],
};

const NATIVE_PUBLISH_PLATFORMS: ReadonlySet<SiteTechPlatform> = new Set(["wordpress"]);

/**
 * Detects the most likely website platform from a probe result.
 * Pure and deterministic: same input always yields the same detection.
 */
export function detectSiteTech(input: SiteTechProbeInput): SiteTechDetection {
  const ctx = normalizeProbe(input);

  const candidates: SiteTechCandidate[] = [];

  for (const [platform, signals] of Object.entries(PLATFORM_SIGNALS) as [
    Exclude<SiteTechPlatform, "unknown">,
    Signal[],
  ][]) {
    const matched: string[] = [];
    let score = 0;

    for (const signal of signals) {
      let ok = false;
      try {
        ok = signal.test(ctx);
      } catch {
        ok = false;
      }
      if (ok) {
        matched.push(signal.key);
        score += signal.weight;
      }
    }

    if (matched.length > 0) {
      candidates.push({
        platform,
        confidence: clamp01(score),
        signals: matched,
      });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence || b.signals.length - a.signals.length);

  const best = candidates[0];

  if (!best || best.confidence < MIN_CONFIDENCE) {
    return {
      platform: "unknown",
      confidence: 0,
      signals: [],
      candidates,
      canPublishNatively: false,
      recommendedPublishing: "universal",
    };
  }

  const canPublishNatively = NATIVE_PUBLISH_PLATFORMS.has(best.platform);

  return {
    platform: best.platform,
    confidence: best.confidence,
    signals: best.signals,
    candidates,
    canPublishNatively,
    recommendedPublishing: canPublishNatively ? "wordpress" : "universal",
  };
}

function normalizeProbe(input: SiteTechProbeInput): NormalizedProbe {
  const html = (input.html ?? "").slice(0, 5_000_000);
  const headers: Record<string, string> = {};
  if (input.headers) {
    for (const [key, value] of Object.entries(input.headers)) {
      headers[key.toLowerCase()] = String(value ?? "");
    }
  }

  let host = "";
  if (input.url) {
    try {
      host = new URL(input.url).host.toLowerCase();
    } catch {
      host = "";
    }
  }

  return { html, headers, host };
}

function generatorMatches(html: string, needle: string): boolean {
  const match = html.match(
    /<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );
  const content = match?.[1]?.toLowerCase() ?? "";
  return content.includes(needle.toLowerCase());
}

function headerIncludes(
  headers: Record<string, string>,
  key: string,
  needle: string
): boolean {
  const value = headers[key.toLowerCase()];
  return typeof value === "string" && value.toLowerCase().includes(needle.toLowerCase());
}

function headerHasKeyPrefix(headers: Record<string, string>, prefix: string): boolean {
  const lowerPrefix = prefix.toLowerCase();
  return Object.keys(headers).some((key) => key.startsWith(lowerPrefix));
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
