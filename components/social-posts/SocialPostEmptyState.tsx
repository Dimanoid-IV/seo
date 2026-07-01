import { Share2 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

type SocialPostEmptyStateProps = {
  variant: "no-website" | "no-posts" | "no-data";
};

export function SocialPostEmptyState({ variant }: SocialPostEmptyStateProps) {
  if (variant === "no-website") {
    return (
      <EmptyState
        icon={Share2}
        title="Add a website to start tracking growth opportunities"
        description="Social posts are created from real website growth data and opportunities."
      />
    );
  }

  if (variant === "no-data") {
    return (
      <EmptyState
        icon={Share2}
        title="RankBoost needs growth data before it can suggest useful posts"
        description="Run an audit or connect Google Search Console first."
      />
    );
  }

  return (
    <EmptyState
      icon={Share2}
      title="No social posts yet"
      description="Generate your first post from a task, article, or Search Console opportunity."
    />
  );
}
