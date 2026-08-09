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
import { getGhostPublishingConfig } from "@/lib/publishing/ghost-config";
import { getGitHubPrConfig } from "@/lib/publishing/github-pr-config";
import { getNoCodeAutomationConfig } from "@/lib/publishing/no-code-automation-config";
import { getShopifyPublishingConfig } from "@/lib/publishing/shopify-config";
import { getWebflowPublishingConfig } from "@/lib/publishing/webflow-config";

export interface ArticleUniversalExportResult {
  articleId: string;
  wordpressConnected: boolean;
  webhookTested: boolean;
  hostedBlog: {
    url: string;
    published: boolean;
  };
  customPublishing: CustomPublishingDisplayState;
  githubPr: {
    connected: boolean;
    repo: string | null;
    contentPath: string | null;
  };
  webflow: {
    connected: boolean;
    collectionId: string | null;
  };
  shopify: {
    connected: boolean;
    shopDomain: string | null;
    blogId: string | null;
  };
  ghost: {
    connected: boolean;
    adminUrl: string | null;
  };
  noCodeAutomation: {
    zapierConnected: boolean;
    makeConnected: boolean;
  };
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
  const ghost = await getGhostPublishingConfig(article.websiteId);
  const github = await getGitHubPrConfig(article.websiteId);
  const [zapier, make] = await Promise.all([
    getNoCodeAutomationConfig({ websiteId: article.websiteId, provider: "zapier" }),
    getNoCodeAutomationConfig({ websiteId: article.websiteId, provider: "make" }),
  ]);
  const shopify = await getShopifyPublishingConfig(article.websiteId);
  const webflow = await getWebflowPublishingConfig(article.websiteId);
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
    githubPr: {
      connected: github?.connected === true,
      repo: github ? `${github.owner}/${github.repo}` : null,
      contentPath: github?.contentPath ?? null,
    },
    webflow: {
      connected: webflow?.connected === true,
      collectionId: webflow?.collectionId ?? null,
    },
    shopify: {
      connected: shopify?.connected === true,
      shopDomain: shopify?.shopDomain ?? null,
      blogId: shopify?.blogId ?? null,
    },
    ghost: {
      connected: ghost?.connected === true,
      adminUrl: ghost?.adminUrl ?? null,
    },
    noCodeAutomation: {
      zapierConnected: zapier?.connected === true,
      makeConnected: make?.connected === true,
    },
    export: pkg,
  };
}
