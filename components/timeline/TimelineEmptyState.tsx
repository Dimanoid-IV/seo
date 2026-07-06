"use client";

import { Globe, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type TimelineEmptyStateProps = {
  variant: "no-website" | "no-events";
};

export function TimelineEmptyState({ variant }: TimelineEmptyStateProps) {
  const { dict } = useSaasTranslations();
  const t = dict.timeline;

  if (variant === "no-website") {
    return (
      <EmptyState
        icon={Globe}
        title={t.emptyNoWebsiteTitle}
        description={t.emptyNoWebsiteDescription}
      />
    );
  }

  return (
    <EmptyState
      icon={Sparkles}
      title={t.emptyNoEventsTitle}
      description={t.emptyNoEventsDescription}
    />
  );
}
