import {
  SocialPlatform,
  WebsiteLanguage,
} from "@prisma/client";

import type { ApiSocialPlatform, SocialPostQualityIssue } from "./types";

export const PLATFORM_LIMITS: Record<
  SocialPlatform,
  { min: number; max: number }
> = {
  LINKEDIN: { min: 100, max: 1200 },
  FACEBOOK: { min: 50, max: 800 },
  INSTAGRAM: { min: 50, max: 500 },
  X: { min: 20, max: 280 },
  GOOGLE_BUSINESS: { min: 50, max: 500 },
  GENERIC: { min: 50, max: 1000 },
  OTHER: { min: 50, max: 1000 },
};

const FORBIDDEN_PHRASES = [
  /already published/i,
  /we posted/i,
  /auto[- ]?publish/i,
  /опубликован автоматически/i,
  /мы опубликовали/i,
  /boost your business today/i,
  /guaranteed results/i,
  /#\d+%\s*(growth|increase)/i,
];

const GENERIC_SPAM_PATTERNS = [
  /^unlock your potential/i,
  /^transform your business today/i,
  /^revolutionary solution/i,
];

export function mapApiPlatformToSocialPlatform(
  platform: ApiSocialPlatform
): SocialPlatform {
  switch (platform) {
    case "GOOGLE_BUSINESS_PROFILE":
      return SocialPlatform.GOOGLE_BUSINESS;
    case "GENERIC":
      return SocialPlatform.GENERIC;
    default:
      return platform as SocialPlatform;
  }
}

export function validateSocialPostQuality(input: {
  title: string;
  text: string;
  platform: SocialPlatform;
  language: WebsiteLanguage;
  cta?: string | null;
  hashtags?: string[];
}): import("./types").SocialPostQualityResult {
  const issues: SocialPostQualityIssue[] = [];
  const limits = PLATFORM_LIMITS[input.platform];
  const length = input.text.trim().length;

  if (!input.title.trim()) {
    issues.push({
      code: "title_empty",
      message: "Title is required.",
      severity: "ERROR",
    });
  }

  if (!input.text.trim()) {
    issues.push({
      code: "content_empty",
      message: "Post content is empty.",
      severity: "ERROR",
    });
  }

  if (length > limits.max) {
    issues.push({
      code: "too_long",
      message: `Post exceeds ${limits.max} characters for this platform.`,
      severity: "ERROR",
    });
  } else if (length < limits.min) {
    issues.push({
      code: "too_short",
      message: `Post is shorter than ${limits.min} characters for this platform.`,
      severity: "WARNING",
    });
  }

  for (const pattern of FORBIDDEN_PHRASES) {
    if (pattern.test(input.text) || pattern.test(input.title)) {
      issues.push({
        code: "auto_publish_language",
        message: "Post contains auto-publish or unsupported claim language.",
        severity: "ERROR",
      });
      break;
    }
  }

  for (const pattern of GENERIC_SPAM_PATTERNS) {
    if (pattern.test(input.text.trim())) {
      issues.push({
        code: "generic_spam",
        message: "Post looks too generic and spammy.",
        severity: "WARNING",
      });
      break;
    }
  }

  if (!input.cta?.trim() && !/\?|learn more|contact|visit|узнать|связ|запиш/i.test(input.text)) {
    issues.push({
      code: "missing_cta",
      message: "Post should include a clear point or call to action.",
      severity: "WARNING",
    });
  }

  if (
    input.platform === SocialPlatform.INSTAGRAM &&
    (!input.hashtags || input.hashtags.length < 2)
  ) {
    issues.push({
      code: "instagram_hashtags",
      message: "Instagram posts should include a few relevant hashtags.",
      severity: "WARNING",
    });
  }

  const penalty = issues.reduce(
    (sum, issue) => sum + (issue.severity === "ERROR" ? 20 : issue.severity === "WARNING" ? 10 : 5),
    0
  );
  const qualityScore = Math.max(0, 100 - penalty);
  const passed = issues.filter((issue) => issue.severity === "ERROR").length === 0;

  return { passed, qualityScore, issues };
}
