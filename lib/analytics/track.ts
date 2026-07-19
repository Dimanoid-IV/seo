import "server-only";

import { Prisma } from "@prisma/client";

import { sanitizeProperties } from "./sanitize";
import {
  isProductEventName,
  type ProductEventName,
  type TrackEventInput,
} from "./types";

/**
 * Privacy-safe product analytics tracker.
 * No-ops safely if DB is unavailable — never throws to callers.
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    const eventName = String(input.event ?? "").trim();
    if (!eventName || eventName.length > 80) return;
    if (!isProductEventName(eventName) && !/^[a-z][a-z0-9_]{1,78}$/.test(eventName)) {
      return;
    }

    const properties = sanitizeProperties(input.properties ?? undefined);

    const { getPrisma } = await import("@/lib/db");
    const prisma = getPrisma();

    await prisma.productEvent.create({
      data: {
        event: eventName as ProductEventName,
        userId: input.userId ?? null,
        organizationId: input.organizationId ?? null,
        websiteId: input.websiteId ?? null,
        route: input.route ? String(input.route).slice(0, 200) : null,
        locale: input.locale ? String(input.locale).slice(0, 16) : null,
        propertiesJson:
          Object.keys(properties).length > 0
            ? (properties as Prisma.InputJsonValue)
            : undefined,
      },
    });
  } catch {
    // Analytics must never break product flows.
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics] trackEvent failed (noop)");
    }
  }
}

/**
 * Fire-and-forget wrapper for sync code paths.
 */
export function trackEventFireAndForget(input: TrackEventInput): void {
  void trackEvent(input);
}
