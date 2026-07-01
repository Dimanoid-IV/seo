import type { Prisma } from "@prisma/client";

export type ContentPlanTask = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  impactScore: number | null;
};

export type ContentPlanArticle = {
  id: string;
  title: string;
  topic: string | null;
  targetKeyword: string | null;
  status: string;
  language: string;
  qualityPassed: boolean | null;
  generatedByAIJobId: string | null;
};

export type ContentPlanSocialPost = {
  id: string;
  platform: string;
  text: string;
  hook: string | null;
  status: string;
  scheduledFor: string | null;
};

export type ContentPlanOverviewData = {
  website: {
    id: string;
    url: string;
  } | null;
  month: string;
  monthlyPlan: {
    id: string;
    status: string;
    summary: string | null;
    goalsJson: Prisma.JsonValue | null;
  } | null;
  tasks: ContentPlanTask[];
  articles: ContentPlanArticle[];
  socialPosts: ContentPlanSocialPost[];
};

export type ContentPlanOverviewResponse = {
  data: ContentPlanOverviewData;
};
