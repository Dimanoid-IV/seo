/**
 * Run with: npx tsx lib/analytics/track.test.ts
 */

import assert from "node:assert/strict";

import { sanitizeProperties, assertNoSensitiveLeak } from "./sanitize";
import { trackEvent, trackEventFireAndForget } from "./track";
import { FUNNEL_STEPS, isProductEventName } from "./types";

async function main() {
  {
    assert.ok(isProductEventName("landing_view"));
    assert.ok(isProductEventName("checkout_started"));
    assert.equal(isProductEventName("not_a_real_event"), false);
    assert.ok(FUNNEL_STEPS.includes("landing_view"));
    assert.ok(FUNNEL_STEPS.includes("checkout_started"));
  }

  {
    // Helper must never throw when DB/provider is unavailable.
    const previous = process.env.DATABASE_URL;
    const g = globalThis as unknown as {
      prisma?: unknown;
      pool?: unknown;
    };
    const prevPrisma = g.prisma;
    const prevPool = g.pool;
    g.prisma = undefined;
    g.pool = undefined;
    delete process.env.DATABASE_URL;

    await assert.doesNotReject(async () => {
      await trackEvent({
        event: "landing_view",
        route: "/ru",
        locale: "ru",
        properties: {
          plan: "starter",
          email: "should-be-stripped@example.com",
          password: "x",
          accessToken: "tok",
        },
      });
    });

    assert.doesNotThrow(() => {
      trackEventFireAndForget({
        event: "register_click",
        properties: { cta: "hero", secret: "nope" },
      });
    });

    await assert.doesNotReject(async () => {
      await trackEvent({ event: "" });
      await trackEvent({ event: "!!!bad!!!" });
    });

    if (previous !== undefined) {
      process.env.DATABASE_URL = previous;
    } else {
      delete process.env.DATABASE_URL;
    }
    g.prisma = prevPrisma;
    g.pool = prevPool;
  }

  {
    const completed = sanitizeProperties({ step: "audit", status: "completed" });
    const failed = sanitizeProperties({
      step: "brand_voice",
      status: "failed",
      reason: "timeout",
      contentHtml: "<p>no</p>",
    });
    assert.equal(completed.step, "audit");
    assert.equal(failed.step, "brand_voice");
    assert.equal(failed.contentHtml, undefined);
    assert.ok(assertNoSensitiveLeak(completed));
    assert.ok(assertNoSensitiveLeak(failed));
  }

  console.log("track.test.ts: ok");
}

void main();
