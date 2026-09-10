import "server-only";

import { after } from "next/server";

import {
  markActivationStarted,
  runActivationPipelineSafe,
} from "./activation-pipeline";
import { trackEventFireAndForget } from "@/lib/analytics/track";
import { getActivationStateForUser } from "./activation-state";
import { activationNeedsRecovery } from "./activation-recovery";
import { safeLogError } from "@/lib/logging";

/**
 * Mark activation running, return immediately, finish work after the response.
 */
export async function scheduleWebsiteActivation(input: {
  userId: string;
  organizationId: string;
  websiteId: string;
  websiteUrl: string;
  locale?: string;
  source?: "website_add" | "subscription_started" | "subscription_sync" | "retry";
}): Promise<void> {
  const current = await getActivationStateForUser(input.userId);
  if (current?.websiteId === input.websiteId && current.status === "running" && !activationNeedsRecovery(current)) return;
  await markActivationStarted({
    userId: input.userId,
    websiteId: input.websiteId,
  });

  trackEventFireAndForget({
    event: "activation_started",
    userId: input.userId,
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    locale: input.locale,
    properties: { source: input.source ?? "website_add" },
  });

  after(async () => {
    try { await runActivationPipelineSafe({
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      websiteUrl: input.websiteUrl,
      locale: input.locale,
    }); } catch (error) {
      safeLogError("activation.worker", error, { websiteId: input.websiteId });
    }
  });
}
