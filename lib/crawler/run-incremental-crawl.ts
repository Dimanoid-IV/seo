import "server-only";

import { CrawlPageType, Prisma } from "@prisma/client";

import { fetchHtmlPage } from "@/lib/audit/fetch";
import { getPrisma } from "@/lib/db";

import { crawlUrlHash, extractCrawlDocument, inferPageType, normalizeCrawlUrl } from "./document";
import { discoverSitemapUrls } from "./sitemap";

export type IncrementalCrawlReport = {
  discovered: number;
  fetched: number;
  changed: number;
  unchanged: number;
  skippedFresh: number;
  failed: number;
};

const DAY_MS = 86_400_000;

export async function runIncrementalCrawl(input: {
  websiteId: string;
  now?: Date;
  maxPages?: number;
  force?: boolean;
}): Promise<IncrementalCrawlReport> {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const maxPages = Math.min(Math.max(input.maxPages ?? 100, 1), 500);
  const website = await prisma.website.findFirst({
    where: { id: input.websiteId, deletedAt: null },
    select: { id: true, organizationId: true, url: true },
  });
  if (!website) throw new Error("website_not_found");

  const homeUrl = normalizeCrawlUrl(website.url);
  if (!homeUrl) throw new Error("website_url_invalid");
  const origin = new URL(homeUrl).origin;
  const sitemapUrls = await discoverSitemapUrls(homeUrl, maxPages);
  const sitemapSet = new Set(
    sitemapUrls
      .map((url) => normalizeCrawlUrl(url))
      .filter((url): url is string => Boolean(url))
  );
  const queue = [homeUrl, ...sitemapUrls]
    .map((url) => normalizeCrawlUrl(url))
    .filter((url): url is string => Boolean(url && new URL(url).origin === origin));
  const queued = new Set(queue);
  const depths = new Map<string, number>([[homeUrl, 0]]);
  for (const sitemapUrl of sitemapSet) depths.set(sitemapUrl, 1);
  const visited = new Set<string>();
  const report: IncrementalCrawlReport = {
    discovered: queue.length,
    fetched: 0,
    changed: 0,
    unchanged: 0,
    skippedFresh: 0,
    failed: 0,
  };

  while (queue.length && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);
    const urlHash = crawlUrlHash(url);
    const previous = await prisma.crawledPage.findUnique({
      where: { websiteId_urlHash: { websiteId: website.id, urlHash } },
      select: { id: true, contentHash: true, unchangedCount: true, nextCrawlAt: true },
    });
    if (!input.force && previous?.nextCrawlAt && previous.nextCrawlAt > now) {
      report.skippedFresh += 1;
      continue;
    }

    try {
      const fetched = await fetchHtmlPage(url, 15_000);
      const finalUrl = normalizeCrawlUrl(fetched.finalUrl) ?? url;
      if (new URL(finalUrl).origin !== origin) throw new Error("cross_origin_redirect");
      const document = extractCrawlDocument(fetched.html, finalUrl);
      const changed = previous?.contentHash !== document.contentHash;
      const unchangedCount = changed ? 0 : (previous?.unchangedCount ?? 0) + 1;
      const nextCrawlDays = changed ? 1 : Math.min(7 + unchangedCount * 3, 30);
      const page = await prisma.crawledPage.upsert({
        where: { websiteId_urlHash: { websiteId: website.id, urlHash } },
        create: {
          websiteId: website.id,
          organizationId: website.organizationId,
          url,
          normalizedUrl: finalUrl,
          urlHash,
          canonicalUrl: document.canonicalUrl,
          pageType: inferPageType(finalUrl) as CrawlPageType,
          locale: document.locale,
          statusCode: fetched.statusCode,
          redirectTarget: finalUrl === url ? null : finalUrl,
          indexable: document.indexable,
          robotsDirective: document.robotsDirective,
          contentHash: document.contentHash,
          inSitemap: sitemapSet.has(url),
          crawlDepth: depths.get(url) ?? null,
          lastCrawledAt: now,
          nextCrawlAt: new Date(now.getTime() + nextCrawlDays * DAY_MS),
        },
        update: {
          normalizedUrl: finalUrl,
          canonicalUrl: document.canonicalUrl,
          pageType: inferPageType(finalUrl) as CrawlPageType,
          locale: document.locale,
          statusCode: fetched.statusCode,
          redirectTarget: finalUrl === url ? null : finalUrl,
          indexable: document.indexable,
          robotsDirective: document.robotsDirective,
          contentHash: document.contentHash,
          inSitemap: sitemapSet.has(url),
          crawlDepth: depths.get(url) ?? null,
          lastCrawledAt: now,
          nextCrawlAt: new Date(now.getTime() + nextCrawlDays * DAY_MS),
          unchangedCount,
          consecutiveFailures: 0,
          lastErrorCode: null,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (changed) {
        await prisma.pageSnapshot.upsert({
          where: { crawledPageId_contentHash: { crawledPageId: page.id, contentHash: document.contentHash } },
          create: {
            crawledPageId: page.id,
            contentHash: document.contentHash,
            statusCode: fetched.statusCode,
            title: document.title,
            metaDescription: document.metaDescription,
            headingsJson: document.headings as Prisma.InputJsonValue,
            bodyText: document.bodyText.slice(0, 200_000),
            internalLinksJson: document.internalLinks as Prisma.InputJsonValue,
            internalLinkDetailsJson: document.internalLinkDetails as Prisma.InputJsonValue,
            externalLinksJson: document.externalLinks as Prisma.InputJsonValue,
            canonicalUrl: document.canonicalUrl,
            robotsDirective: document.robotsDirective,
            indexable: document.indexable,
            schemaJson: document.schema as Prisma.InputJsonValue,
            hreflangJson: document.hreflang as Prisma.InputJsonValue,
            imagesJson: document.images as Prisma.InputJsonValue,
            wordCount: document.wordCount,
            responseTimeMs: fetched.responseTimeMs,
            fetchedAt: now,
          },
          update: { fetchedAt: now, responseTimeMs: fetched.responseTimeMs },
        });
        report.changed += 1;
      } else {
        report.unchanged += 1;
      }
      report.fetched += 1;

      for (const link of document.internalLinks) {
        if (visited.size + queue.length >= maxPages || queued.has(link)) continue;
        queued.add(link);
        depths.set(link, (depths.get(url) ?? 0) + 1);
        queue.push(link);
        report.discovered += 1;
      }
    } catch (error) {
      await prisma.crawledPage.upsert({
        where: { websiteId_urlHash: { websiteId: website.id, urlHash } },
        create: {
          websiteId: website.id,
          organizationId: website.organizationId,
          url,
          normalizedUrl: url,
          urlHash,
          consecutiveFailures: 1,
          lastErrorCode: error instanceof Error ? error.message.slice(0, 120) : "crawl_failed",
          lastCrawledAt: now,
          nextCrawlAt: new Date(now.getTime() + 60 * 60 * 1000),
        },
        update: {
          consecutiveFailures: { increment: 1 },
          lastErrorCode: error instanceof Error ? error.message.slice(0, 120) : "crawl_failed",
          lastCrawledAt: now,
          nextCrawlAt: new Date(now.getTime() + 60 * 60 * 1000),
        },
      });
      report.failed += 1;
    }
  }

  return report;
}
