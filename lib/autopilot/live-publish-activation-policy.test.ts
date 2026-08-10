import assert from "node:assert/strict";

import { evaluateLivePublishActivationPrerequisites } from "./live-publish-activation-policy";

assert.deepEqual(
  evaluateLivePublishActivationPrerequisites({
    planApprovedForAutoPublish: true,
    publishingIntegrationConnected: true,
    livePublishPaused: false,
  }),
  { allowed: true, reason: null }
);

assert.equal(
  evaluateLivePublishActivationPrerequisites({
    planApprovedForAutoPublish: false,
    publishingIntegrationConnected: true,
    livePublishPaused: false,
  }).reason,
  "plan_not_approved_for_auto_publish"
);

assert.equal(
  evaluateLivePublishActivationPrerequisites({
    planApprovedForAutoPublish: true,
    publishingIntegrationConnected: false,
    livePublishPaused: false,
  }).reason,
  "publishing_integration_not_connected"
);

assert.equal(
  evaluateLivePublishActivationPrerequisites({
    planApprovedForAutoPublish: true,
    publishingIntegrationConnected: true,
    livePublishPaused: true,
  }).reason,
  "live_publish_paused"
);

console.log("live-publish-activation-policy tests passed");

