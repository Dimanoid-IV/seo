import { WordPressConnectionStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import type { SerializedArticle } from "./types";
import type { ArticleQualityIssuesSnapshot } from "@/lib/hermes/article-quality";

type ArticleRecord = {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  slug: string | null;
  language: string;
  status: string;
  topic: string | null;
  targetKeyword: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  contentHtml: string | null;
  faqJson: unknown;
  schemaJson: unknown;
  wordpressPostId: string | null;
  wordpressEditUrl: string | null;
  wordpressPublishedUrl?: string | null;
  wordpressRolledBackAt?: Date | null;
  generatedByAIJobId?: string | null;
  qualityScore?: number | null;
  qualityPassed?: boolean | null;
  qualityIssuesJson?: unknown;
  qualityRepairAttempts?: number;
  approvedAt: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeArticleRecord(
  article: ArticleRecord,
  wordpressConnected: boolean
): SerializedArticle {
  return {
    id: article.id,
    websiteId: article.websiteId,
    organizationId: article.organizationId,
    title: article.title,
    slug: article.slug,
    language: article.language,
    status: article.status,
    topic: article.topic,
    targetKeyword: article.targetKeyword,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    contentHtml: article.contentHtml,
    faqJson: article.faqJson as SerializedArticle["faqJson"],
    schemaJson: article.schemaJson as SerializedArticle["schemaJson"],
    wordpressPostId: article.wordpressPostId,
    wordpressEditUrl: article.wordpressEditUrl,
    wordpressPublishedUrl: article.wordpressPublishedUrl ?? null,
    wordpressRolledBackAt:
      article.wordpressRolledBackAt?.toISOString() ?? null,
    generatedByAIJobId: article.generatedByAIJobId ?? null,
    qualityScore: article.qualityScore ?? null,
    qualityPassed: article.qualityPassed ?? null,
    qualityIssuesJson:
      (article.qualityIssuesJson as ArticleQualityIssuesSnapshot | null) ??
      null,
    qualityRepairAttempts: article.qualityRepairAttempts ?? 0,
    wordpressConnected,
    approvedAt: article.approvedAt?.toISOString() ?? null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function isWordPressConnectedForWebsite(
  websiteId: string
): Promise<boolean> {
  const prisma = getPrisma();

  const connection = await prisma.wordPressConnection.findFirst({
    where: {
      websiteId,
      disconnectedAt: null,
      status: WordPressConnectionStatus.CONNECTED,
    },
    select: { id: true },
  });

  return Boolean(connection);
}
