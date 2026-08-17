import { load } from "cheerio";

import { assertSafeUrl } from "@/lib/audit/ssrf";

const MAX_SITEMAP_BYTES = 5_000_000;

export function parseSitemapLocations(xml: string): { urls: string[]; sitemaps: string[] } {
  const $ = load(xml, { xmlMode: true });
  const locations = $("loc")
    .toArray()
    .map((element) => $(element).text().trim())
    .filter(Boolean);
  return $("sitemapindex").length > 0
    ? { urls: [], sitemaps: locations }
    : { urls: locations, sitemaps: [] };
}

async function fetchText(urlValue: string): Promise<string> {
  let currentUrl = urlValue;
  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    const url = new URL(currentUrl);
    await assertSafeUrl(url);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "RankBoostBot/1.0", Accept: "application/xml,text/xml,text/plain,*/*;q=0.1" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("sitemap_redirect_without_location");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    if (!response.ok) throw new Error(`sitemap_http_${response.status}`);
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > MAX_SITEMAP_BYTES) throw new Error("sitemap_too_large");
    return (await response.text()).slice(0, MAX_SITEMAP_BYTES);
  }
  throw new Error("sitemap_too_many_redirects");
}

export async function discoverSitemapUrls(siteUrl: string, limit = 5_000): Promise<string[]> {
  const origin = new URL(siteUrl).origin;
  let robots = "";
  try {
    robots = await fetchText(new URL("/robots.txt", origin).toString());
  } catch {
    // sitemap.xml remains the standards-based fallback when robots.txt is absent.
  }
  const declared = robots
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*sitemap\s*:\s*(\S+)/i)?.[1])
    .filter((url): url is string => Boolean(url));
  const queue = [...new Set([...declared, new URL("/sitemap.xml", origin).toString()])];
  const visited = new Set<string>();
  const urls = new Set<string>();

  while (queue.length && visited.size < 20 && urls.size < limit) {
    const sitemapUrl = queue.shift()!;
    if (visited.has(sitemapUrl)) continue;
    visited.add(sitemapUrl);
    try {
      const parsed = parseSitemapLocations(await fetchText(sitemapUrl));
      for (const nested of parsed.sitemaps) {
        if (new URL(nested, sitemapUrl).origin === origin) queue.push(new URL(nested, sitemapUrl).toString());
      }
      for (const value of parsed.urls) {
        const url = new URL(value, sitemapUrl);
        if (url.origin === origin) urls.add(url.toString());
        if (urls.size >= limit) break;
      }
    } catch {
      // One broken sitemap must not prevent link-based crawling.
    }
  }
  return [...urls];
}
