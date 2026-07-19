import "server-only";

import { after } from "next/server";

import {
  markActivationStarted,
  runActivationPipelineSafe,
} from "./activation-pipeline";

/**
 * Mark activation running, return immediately, finish work after the response.
 */
export async function scheduleWebsiteActivation(input: {
  userId: string;
  organizationId: string;
  websiteId: string;
  websiteUrl: string;
  locale?: string;
}): Promise<void> {
  await markActivationStarted({
    userId: input.userId,
    websiteId: input.websiteId,
  });

  after(async () => {
    await runActivationPipelineSafe({
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      websiteUrl: input.websiteUrl,
      locale: input.locale,
    });
  });
}
