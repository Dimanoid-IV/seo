"use client";

import type { SocialPostViewModel } from "@/lib/social-posts/types";
import { cn } from "@/lib/utils";

type PlatformBadgeProps = {
  platform: string;
  className?: string;
};

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const labels: Record<string, string> = {
    LINKEDIN: "LinkedIn",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    X: "X",
    GOOGLE_BUSINESS: "Google Business",
    GENERIC: "Generic",
    OTHER: "Other",
  };

  return (
    <span
      className={cn(
        "rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300",
        className
      )}
    >
      {labels[platform] ?? platform}
    </span>
  );
}

type SocialPostQualityBadgeProps = {
  post: SocialPostViewModel;
};

export function SocialPostQualityBadge({ post }: SocialPostQualityBadgeProps) {
  const hasErrors = post.qualityIssues?.some((issue) => issue.severity === "ERROR");
  const hasWarnings = post.qualityIssues?.some(
    (issue) => issue.severity === "WARNING"
  );

  if (post.status === "READY" && !hasErrors && !hasWarnings) {
    return (
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
        Ready for review
      </span>
    );
  }

  if (hasErrors || hasWarnings || post.status === "DRAFT") {
    return (
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        Needs review
        {post.qualityScore != null ? ` · ${post.qualityScore}/100` : ""}
      </span>
    );
  }

  return null;
}
