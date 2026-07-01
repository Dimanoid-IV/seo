import type { SocialPost } from "@prisma/client";

import type { SocialPostQualityIssue, SocialPostViewModel } from "./types";

function parseHashtags(value: unknown): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => typeof tag === "string");
  }
  return [];
}

function parseQualityIssues(value: unknown): SocialPostQualityIssue[] | undefined {
  if (!value || !Array.isArray(value)) {
    return undefined;
  }
  return value as SocialPostQualityIssue[];
}

export function formatSocialPost(post: SocialPost): SocialPostViewModel {
  return {
    id: post.id,
    title: post.title?.trim() || post.hook?.trim() || "Social post draft",
    content: post.text,
    platform: post.platform,
    status: post.status,
    source: post.source,
    sourceId: post.sourceId ?? undefined,
    language: post.language,
    hook: post.hook ?? undefined,
    hashtags: parseHashtags(post.hashtagsJson),
    cta: post.cta ?? undefined,
    qualityScore: post.qualityScore ?? undefined,
    qualityIssues: parseQualityIssues(post.qualityIssuesJson),
    copiedAt: post.copiedAt?.toISOString(),
    approvedAt: post.approvedAt?.toISOString(),
    scheduledFor: post.scheduledFor?.toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export const PLATFORM_LABELS: Record<string, string> = {
  LINKEDIN: "LinkedIn",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  X: "X",
  GOOGLE_BUSINESS: "Google Business",
  GENERIC: "Generic",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  READY: "Ready for review",
  COPIED: "Copied",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED_EXTERNALLY: "Published externally",
  ARCHIVED: "Archived",
};

export const SOURCE_LABELS: Record<string, string> = {
  TASK: "Task",
  ARTICLE: "Article",
  CONTENT_IDEA: "Content idea",
  GSC_INSIGHT: "Search Console",
  TIMELINE_EVENT: "Timeline",
  GROWTH_SCORE: "Growth Score",
  CONTINUOUS_IMPROVEMENT: "Growth opportunity",
  MANUAL: "Manual",
};
