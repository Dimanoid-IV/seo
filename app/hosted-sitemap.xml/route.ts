import { ArticleStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { getServerEnv, publicEnv } from "@/lib/env";
import { buildHostedArticleUrl } from "@/lib/hosted-blog/urls";
import { renderHostedSitemap } from "@/lib/hosted-blog/sitemap";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getServerEnv();
  if (!env.DATABASE_URL) {
    return xmlResponse(renderHostedSitemap([]));
  }

  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/+$/g, "");
  const prisma = getPrisma();
  const articles = await prisma.article.findMany({
    where: {
      deletedAt: null,
      status: ArticleStatus.PUBLISHED,
      qualityPassed: true,
      publishedAt: { not: null },
      wordpressPostId: null,
      wordpressPublishedUrl: {
        startsWith: `${siteUrl}/hosted/articles/`,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 5000,
  });

  const entries = articles
    .filter((article) => Boolean(article.publishedAt))
    .map((article) => ({
      url: buildHostedArticleUrl({
        articleId: article.id,
        slug: article.slug,
        title: article.title,
      }),
      lastModified: article.updatedAt ?? article.publishedAt ?? new Date(),
    }));

  return xmlResponse(renderHostedSitemap(entries));
}

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
