import "server-only";

import { ArticleStatus } from "@prisma/client";

import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import { getPrisma } from "@/lib/db";
import {
  buildHostedArticleSlug,
  buildHostedArticleUrl,
} from "@/lib/hosted-blog/urls";
import { buildUniversalExport } from "@/lib/publishing/universal-export";

export type HostedPublicArticle = {
  id: string;
  websiteId: string;
  title: string;
  slug: string;
  language: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  bodyHtml: string;
  publishedAt: Date;
  websiteUrl: string;
  hostedUrl: string;
};

export async function getHostedPublicArticle({
  articleId,
  slug,
}: {
  articleId: string;
  slug: string;
}): Promise<HostedPublicArticle | null> {
  const prisma = getPrisma();
  const article = await prisma.article.findFirst({
    where: {
      id: articleId,
      deletedAt: null,
      status: ArticleStatus.PUBLISHED,
      qualityPassed: true,
      publishedAt: { not: null },
      wordpressPostId: null,
    },
    select: {
      id: true,
      websiteId: true,
      title: true,
      slug: true,
      language: true,
      metaTitle: true,
      metaDescription: true,
      contentHtml: true,
      publishedAt: true,
      wordpressPublishedUrl: true,
      website: {
        select: {
          url: true,
        },
      },
    },
  });

  if (!article?.publishedAt) {
    return null;
  }

  const expectedSlug = buildHostedArticleSlug({
    slug: article.slug,
    title: article.title,
  });
  if (slug !== expectedSlug) {
    return null;
  }

  const hostedUrl = buildHostedArticleUrl({
    articleId: article.id,
    slug: article.slug,
    title: article.title,
  });

  if (article.wordpressPublishedUrl && article.wordpressPublishedUrl !== hostedUrl) {
    return null;
  }

  const brandKit = await loadBrandKitForWebsite(article.websiteId);
  const pkg = buildUniversalExport(
    {
      title: article.title,
      slug: article.slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      contentHtml: article.contentHtml,
      language: article.language,
    },
    {
      websiteUrl: article.website.url,
      brandKit,
    }
  );

  return {
    id: article.id,
    websiteId: article.websiteId,
    title: article.title,
    slug: expectedSlug,
    language: article.language,
    metaTitle: pkg.metaTitle,
    metaDescription: pkg.metaDescription,
    canonicalUrl: hostedUrl,
    bodyHtml: pkg.bodyHtml,
    publishedAt: article.publishedAt,
    websiteUrl: article.website.url,
    hostedUrl,
  };
}
