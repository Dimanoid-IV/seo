"use client";

import { useEffect } from "react";

import { trackClientEvent } from "@/lib/analytics/client";
import type { ProductEventName } from "@/lib/analytics/types";

type AnalyticsPageViewProps = {
  event: ProductEventName;
  locale?: string;
  route?: string;
};

/**
 * Fires a single page-view product event on mount (landing/pricing).
 */
export function AnalyticsPageView({
  event,
  locale,
  route,
}: AnalyticsPageViewProps) {
  useEffect(() => {
    trackClientEvent({
      event,
      locale,
      route,
      properties: { page: event },
    });
  }, [event, locale, route]);

  return null;
}
