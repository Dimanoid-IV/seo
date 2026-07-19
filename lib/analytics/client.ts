/**
 * Client-side product analytics (public + auth pages).
 * Posts to /api/analytics/event — privacy-safe server sanitization.
 */

import type { ProductEventName } from "./types";

type ClientTrackInput = {
  event: ProductEventName | string;
  route?: string;
  locale?: string;
  properties?: Record<string, unknown>;
  websiteId?: string;
};

export function trackClientEvent(input: ClientTrackInput): void {
  try {
    const payload = {
      event: input.event,
      route:
        input.route ??
        (typeof window !== "undefined" ? window.location.pathname : undefined),
      locale: input.locale,
      websiteId: input.websiteId,
      properties: input.properties,
    };

    const body = JSON.stringify(payload);

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/event", blob);
      return;
    }

    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // ignore
    });
  } catch {
    // ignore
  }
}
