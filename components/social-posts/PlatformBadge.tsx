"use client";

import type { SocialPostViewModel } from "@/lib/social-posts/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type PlatformBadgeProps = {
  platform: string;
  className?: string;
};

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const { dict } = useSaasTranslations();
  const platforms = dict.socialPosts.platforms;

  return (
    <span
      className={cn(
        "rounded-md border border-slate-200 bg-white/5 px-2 py-0.5 text-xs text-slate-600",
        className
      )}
    >
      {platforms[platform as keyof typeof platforms] ?? platform}
    </span>
  );
}

type SocialPostQualityBadgeProps = {
  post: SocialPostViewModel;
};

export function SocialPostQualityBadge({ post }: SocialPostQualityBadgeProps) {
  const { dict } = useSaasTranslations();
  const s = dict.socialPosts;

  const hasErrors = post.qualityIssues?.some((issue) => issue.severity === "ERROR");
  const hasWarnings = post.qualityIssues?.some(
    (issue) => issue.severity === "WARNING"
  );

  if (post.status === "READY" && !hasErrors && !hasWarnings) {
    return (
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        {s.readyForReview}
      </span>
    );
  }

  if (hasErrors || hasWarnings || post.status === "DRAFT") {
    return (
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        {dict.statuses.needsReview}
        {post.qualityScore != null ? ` · ${post.qualityScore}/100` : ""}
      </span>
    );
  }

  return null;
}
