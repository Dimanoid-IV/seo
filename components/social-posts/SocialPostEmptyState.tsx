"use client";

import { Share2 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type SocialPostEmptyStateProps = {
  variant: "no-website" | "no-posts" | "no-data";
};

export function SocialPostEmptyState({ variant }: SocialPostEmptyStateProps) {
  const { dict } = useSaasTranslations();
  const s = dict.socialPosts;

  if (variant === "no-website") {
    return (
      <EmptyState
        icon={Share2}
        title={s.noWebsiteTitle}
        description={s.noWebsiteDescription}
      />
    );
  }

  if (variant === "no-data") {
    return (
      <EmptyState
        icon={Share2}
        title={s.noDataTitle}
        description={s.noDataDescription}
      />
    );
  }

  return (
    <EmptyState
      icon={Share2}
      title={s.emptyTitle}
      description={s.emptyDescription}
    />
  );
}
