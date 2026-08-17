import "server-only";

import { load } from "cheerio";

import { fetchHtmlPage } from "@/lib/audit/fetch";
import { assertSafeUrl } from "@/lib/audit/ssrf";

export type PublicationVerification = {
  verified: boolean;
  statusCode: number | null;
  finalUrl: string | null;
  errorCode: string | null;
  checks: {
    statusOk: boolean;
    titleFound: boolean;
    contentMarkerFound: boolean;
    canonicalMatches: boolean;
    indexable: boolean;
    robotsAllowed: boolean;
    sitemapContainsUrl: boolean;
  };
  sitemapUrl: string | null;
};

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeComparableUrl(value: string): string | null {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function contentMarkers(contentHtml: string): string[] {
  const words = normalizeText(contentHtml)
    .split(" ")
    .filter((word) => word.length >= 5);
  return [...new Set(words)].slice(0, 8);
}

export function inspectPublishedHtml(input: {
  html: string;
  finalUrl: string;
  statusCode: number;
  expectedUrl: string;
  expectedTitle: string;
  expectedContentHtml: string;
  robotsAllowed?: boolean;
  sitemapContainsUrl?: boolean;
  sitemapUrl?: string | null;
}): PublicationVerification {
  const $ = load(input.html);
  $("script,style,noscript").remove();

  const visibleText = normalizeText($("body").text());
  const pageTitle = normalizeText(`${$("title").text()} ${$("h1").first().text()}`);
  const expectedTitle = normalizeText(input.expectedTitle);
  const markers = contentMarkers(input.expectedContentHtml);
  const matchedMarkers = markers.filter((marker) => visibleText.includes(marker));
  const canonicalHref = $('link[rel="canonical"]').attr("href") ?? null;
  const canonicalUrl = canonicalHref
    ? normalizeComparableUrl(new URL(canonicalHref, input.finalUrl).toString())
    : null;
  const expectedUrl = normalizeComparableUrl(input.expectedUrl);
  const robots = normalizeText(
    $('meta[name="robots"], meta[name="googlebot"]').map((_, el) => $(el).attr("content") ?? "").get().join(" ")
  );

  const checks = {
    statusOk: input.statusCode >= 200 && input.statusCode < 300,
    titleFound: expectedTitle.length > 0 && pageTitle.includes(expectedTitle),
    contentMarkerFound:
      markers.length > 0 && matchedMarkers.length >= Math.min(5, markers.length),
    canonicalMatches: Boolean(canonicalUrl && expectedUrl && canonicalUrl === expectedUrl),
    indexable: !robots.includes("noindex"),
    robotsAllowed: input.robotsAllowed ?? true,
    sitemapContainsUrl: input.sitemapContainsUrl ?? true,
  };
  const verified = Object.values(checks).every(Boolean);

  return {
    verified,
    statusCode: input.statusCode,
    finalUrl: input.finalUrl,
    errorCode: verified ? null : "published_page_not_verified",
    checks,
    sitemapUrl: input.sitemapUrl ?? null,
  };
}

function normalizePathname(pathname: string): string {
  const decoded = decodeURIComponent(pathname || "/");
  return decoded.startsWith("/") ? decoded : `/${decoded}`;
}

export function isUrlAllowedByRobotsTxt(input: {
  robotsTxt: string;
  publicUrl: string;
}): boolean {
  const path = normalizePathname(new URL(input.publicUrl).pathname);
  let appliesToRankBoost = false;
  let appliesToAll = false;
  const disallowed: string[] = [];

  for (const rawLine of input.robotsTxt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      appliesToRankBoost = value.toLowerCase() === "rankboostbot";
      appliesToAll = value === "*";
      continue;
    }
    if (field === "disallow" && (appliesToRankBoost || appliesToAll) && value) {
      disallowed.push(normalizePathname(value));
    }
  }

  return !disallowed.some((rule) => rule === "/" || path.startsWith(rule));
}

export function sitemapContainsPublicUrl(input: {
  sitemapXml: string;
  publicUrl: string;
}): boolean {
  const expected = normalizeComparableUrl(input.publicUrl);
  if (!expected) return false;
  const $ = load(input.sitemapXml, { xmlMode: true });
  return $("loc")
    .toArray()
    .some((element) => normalizeComparableUrl($(element).text().trim()) === expected);
}

async function fetchPublicText(url: string): Promise<{ text: string; finalUrl: string }> {
  let currentUrl = url;
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const parsed = new URL(currentUrl);
    await assertSafeUrl(parsed);
    const response = await fetch(parsed, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "RankBoostBot/1.0" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("redirect_without_location");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    if (!response.ok) throw new Error(`http_${response.status}`);
    const text = (await response.text()).slice(0, 5_000_000);
    return { text, finalUrl: currentUrl };
  }
  throw new Error("too_many_redirects");
}

function sitemapCandidates(origin: string, robotsTxt: string): string[] {
  const fromRobots = robotsTxt
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*sitemap\s*:\s*(\S+)/i)?.[1])
    .filter((value): value is string => Boolean(value));
  return [...new Set([...fromRobots, new URL("/sitemap.xml", origin).toString()])].slice(0, 5);
}

export async function verifyPublishedPage(input: {
  publicUrl: string;
  expectedTitle: string;
  expectedContentHtml: string;
}): Promise<PublicationVerification> {
  try {
    const page = await fetchHtmlPage(input.publicUrl, 12_000);
    const origin = new URL(page.finalUrl).origin;
    let robotsTxt = "";
    let robotsAllowed = true;
    try {
      robotsTxt = (await fetchPublicText(new URL("/robots.txt", origin).toString())).text;
      robotsAllowed = isUrlAllowedByRobotsTxt({ robotsTxt, publicUrl: page.finalUrl });
    } catch {
      // Missing robots.txt means there is no robots exclusion to enforce.
    }

    let sitemapContainsUrl = false;
    let matchedSitemapUrl: string | null = null;
    const sitemapQueue = sitemapCandidates(origin, robotsTxt);
    const checkedSitemaps = new Set<string>();
    while (sitemapQueue.length > 0 && checkedSitemaps.size < 12) {
      const candidate = sitemapQueue.shift()!;
      if (checkedSitemaps.has(candidate)) continue;
      checkedSitemaps.add(candidate);
      try {
        const sitemap = await fetchPublicText(candidate);
        if (sitemapContainsPublicUrl({ sitemapXml: sitemap.text, publicUrl: page.finalUrl })) {
          sitemapContainsUrl = true;
          matchedSitemapUrl = sitemap.finalUrl;
          break;
        }
        const xml = load(sitemap.text, { xmlMode: true });
        if (xml("sitemapindex").length > 0) {
          xml("loc").each((_, element) => {
            try {
              const nested = new URL(xml(element).text().trim(), sitemap.finalUrl);
              if (nested.origin === origin && !checkedSitemaps.has(nested.toString())) {
                sitemapQueue.push(nested.toString());
              }
            } catch {
              // Ignore malformed sitemap-index locations.
            }
          });
        }
      } catch {
        // Try the next declared/default sitemap and let the job retry if none verify.
      }
    }
    return inspectPublishedHtml({
      html: page.html,
      finalUrl: page.finalUrl,
      statusCode: page.statusCode,
      expectedUrl: input.publicUrl,
      expectedTitle: input.expectedTitle,
      expectedContentHtml: input.expectedContentHtml,
      robotsAllowed,
      sitemapContainsUrl,
      sitemapUrl: matchedSitemapUrl,
    });
  } catch {
    return {
      verified: false,
      statusCode: null,
      finalUrl: null,
      errorCode: "verification_fetch_failed",
      checks: {
        statusOk: false,
        titleFound: false,
        contentMarkerFound: false,
        canonicalMatches: false,
        indexable: false,
        robotsAllowed: false,
        sitemapContainsUrl: false,
      },
      sitemapUrl: null,
    };
  }
}
