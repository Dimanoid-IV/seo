import type { Prisma } from "@prisma/client";

import type { ArticleQualityIssuesSnapshot } from "@/lib/hermes/article-quality";

export type SerializedArticle = {
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
  faqJson: Prisma.JsonValue | null;
  schemaJson: Prisma.JsonValue | null;
  wordpressPostId: string | null;
  wordpressEditUrl: string | null;
  generatedByAIJobId: string | null;
  qualityScore: number | null;
  qualityPassed: boolean | null;
  qualityIssuesJson: ArticleQualityIssuesSnapshot | null;
  qualityRepairAttempts: number;
  wordpressConnected: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleUpdateInput = {
  title?: string;
  slug?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  contentHtml?: string | null;
  status?: string;
};

export type ArticleResponse = {
  data: SerializedArticle;
};
