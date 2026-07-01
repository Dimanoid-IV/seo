import type { SocialPostSource, WebsiteLanguage } from "@prisma/client";

export type SocialPostQualityIssue = {
  code: string;
  message: string;
  severity: "INFO" | "WARNING" | "ERROR";
};

export type SocialPostQualityResult = {
  passed: boolean;
  qualityScore: number;
  issues: SocialPostQualityIssue[];
};

export type SocialPostViewModel = {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: string;
  source: string;
  sourceId?: string;
  language?: string;
  hook?: string;
  hashtags: string[];
  cta?: string;
  qualityScore?: number;
  qualityIssues?: SocialPostQualityIssue[];
  copiedAt?: string;
  approvedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
};

export type SocialPostsListResult = {
  posts: SocialPostViewModel[];
  nextCursor: string | null;
  websiteId: string | null;
};

export type ApiSocialPlatform =
  | "LINKEDIN"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "X"
  | "GOOGLE_BUSINESS_PROFILE"
  | "GENERIC";

export type GenerateSocialPostInput = {
  userId: string;
  organizationId?: string | null;
  websiteId?: string | null;
  platform: ApiSocialPlatform;
  source: SocialPostSource;
  sourceId?: string | null;
  language?: WebsiteLanguage | null;
};
