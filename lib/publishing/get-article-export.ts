import "server-only";

import { getArticleForUser } from "@/lib/articles/article-actions";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";

import { buildUniversalExport, type UniversalExportPackage } from "./universal-export";
import { getCustomPublishingConfig } from "./custom-webhook-config";
import {
  buildCustomPublishingDisplayState,
  type CustomPublishingDisplayState,
} from "./custom-publishing-display";
import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import { buildHostedArticleUrl } from "@/lib/hosted-blog/urls";

export interface ArticleUniversalExportResult {
  articleId: string;
  wordpressConnected: boolean;
  webhookTested: boolean;
  hostedBlog: {
    url: string;
    published: boolean;
  };
  customPublishing: CustomPublishingDisplayState;
  export: UniversalExportPackage;
}

/**
 * Loads an article the user owns and builds its Universal Publishing package.
 * Read-only: never publishes or mutates the article.
 */
export async function getArticleUniversalExport({
  articleId,
  currentUser,
}: {
  articleId: string;
  currentUser: CurrentUser;
}): Promise<ArticleUniversalExportResult> {
  const article = await getArticleForUser({ articleId, currentUser });

  const prisma = getPrisma();
  const website = await prisma.website.findUnique({
    where: { id: article.websiteId },
    select: { url: true },
  });

  const custom = await getCustomPublishingConfig(article.websiteId);
  const brandKit = await loadBrandKitForWebsite(article.websiteId);

  const pkg = buildUniversalExport(
    {
      title: article.title,
      slug: article.slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      contentHtml: article.contentHtml,
      targetKeyword: article.targetKeyword,
      language: article.language,
    },
    { websiteUrl: website?.url ?? "", brandKit }
  );

  return {
    articleId: article.id,
    wordpressConnected: article.wordpressConnected,
    webhookTested: Boolean(custom?.endpointConfigured && custom.testedAt),
    hostedBlog: {
      url: buildHostedArticleUrl({
        articleId: article.id,
        slug: article.slug,
        title: article.title,
      }),
      published:
        article.status === "PUBLISHED" &&
        article.wordpressPostId === null &&
        article.wordpressPublishedUrl ===
          buildHostedArticleUrl({
            articleId: article.id,
            slug: article.slug,
            title: article.title,
          }),
    },
    customPublishing: buildCustomPublishingDisplayState({
      endpointConfigured: custom?.endpointConfigured,
      endpointHost: custom?.endpointHost,
      testedAt: custom?.testedAt,
      hasSharedSecret: custom?.hasSharedSecret,
    }),
    export: pkg,
  };
}
