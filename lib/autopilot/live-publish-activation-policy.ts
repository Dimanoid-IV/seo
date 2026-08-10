export type LivePublishActivationBlockReason =
  | "plan_not_approved_for_auto_publish"
  | "publishing_integration_not_connected"
  | "live_publish_paused";

export function evaluateLivePublishActivationPrerequisites(input: {
  planApprovedForAutoPublish: boolean;
  publishingIntegrationConnected: boolean;
  livePublishPaused: boolean;
}): { allowed: true; reason: null } | { allowed: false; reason: LivePublishActivationBlockReason } {
  if (!input.planApprovedForAutoPublish) {
    return { allowed: false, reason: "plan_not_approved_for_auto_publish" };
  }
  if (!input.publishingIntegrationConnected) {
    return { allowed: false, reason: "publishing_integration_not_connected" };
  }
  if (input.livePublishPaused) {
    return { allowed: false, reason: "live_publish_paused" };
  }
  return { allowed: true, reason: null };
}

