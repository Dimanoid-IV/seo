import { Globe, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";

type TimelineEmptyStateProps = {
  variant: "no-website" | "no-events";
};

export function TimelineEmptyState({ variant }: TimelineEmptyStateProps) {
  if (variant === "no-website") {
    return (
      <EmptyState
        icon={Globe}
        title="Add a website to start tracking growth opportunities"
        description="Once your website is connected, RankBoost will show audit, Search Console, and content activity here."
      />
    );
  }

  return (
    <EmptyState
      icon={Sparkles}
      title="Your growth timeline is empty"
      description="Run your first audit or connect Google Search Console to start seeing growth activity here."
    />
  );
}
