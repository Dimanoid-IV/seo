import assert from "node:assert/strict";
import { MonthlyAutopilotStatus, SubscriptionStatus } from "@prisma/client";

import { shouldTriggerPostSubscriptionActivation } from "./post-subscription-activation";

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    activationStatus: null,
    monthlyPlanStatus: null,
  }),
  true
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.TRIALING,
    activationStatus: "failed",
    monthlyPlanStatus: null,
  }),
  true
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.PAST_DUE,
    activationStatus: null,
    monthlyPlanStatus: null,
  }),
  false
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    activationStatus: "running",
    monthlyPlanStatus: null,
  }),
  false
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    activationStatus: "done",
    monthlyPlanStatus: null,
  }),
  false
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    activationStatus: "partial",
    monthlyPlanStatus: MonthlyAutopilotStatus.DRAFT,
  }),
  true
);

assert.equal(
  shouldTriggerPostSubscriptionActivation({
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    activationStatus: "failed",
    monthlyPlanStatus: MonthlyAutopilotStatus.APPROVED,
  }),
  false
);

console.log("post-subscription-activation checks passed");

