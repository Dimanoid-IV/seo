import "server-only";

import {
  MonthlyAutopilotStatus,
  SubscriptionStatus,
  WebsiteStatus,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { safeLogInfo, safeLogWarn } from "@/lib/logging";
import { getActivationStateForUser } from "@/lib/onboarding/activation-state";
import { scheduleWebsiteActivation } from "@/lib/onboarding/schedule-activation";

export type PostSubscriptionActivationSource =
  | "stripe_webhook"
  | "billing_sync";

export function shouldTriggerPostSubscriptionActivation(input: {
  subscriptionStatus: SubscriptionStatus;
  activationStatus?: string | null;
  monthlyPlanStatus?: MonthlyAutopilotStatus | null;
}): boolean {
  if (
    input.subscriptionStatus !== SubscriptionStatus.ACTIVE &&
    input.subscriptionStatus !== SubscriptionStatus.TRIALING
  ) {
    return false;
  }

  if (input.monthlyPlanStatus === MonthlyAutopilotStatus.APPROVED) {
    return false;
  }

  if (
    input.activationStatus === "running" ||
    input.activationStatus === "done"
  ) {
    return false;
  }

  return true;
}

export async function triggerPostSubscriptionActivation(input: {
  organizationId: string;
  userId?: string | null;
  subscriptionStatus: SubscriptionStatus;
  source: PostSubscriptionActivationSource;
}): Promise<{ started: boolean; reason?: string; websiteId?: string }> {
  const prisma = getPrisma();
  const organization = await prisma.organization.findFirst({
    where: {
      id: input.organizationId,
      deletedAt: null,
    },
    select: {
      ownerUserId: true,
      websites: {
        where: {
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, url: true },
      },
    },
  });

  const userId = input.userId ?? organization?.ownerUserId ?? null;
  const website = organization?.websites[0] ?? null;

  if (!organization || !userId) {
    return { started: false, reason: "missing_user" };
  }

  if (!website) {
    return { started: false, reason: "missing_website" };
  }

  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const [activation, monthlyPlan] = await Promise.all([
    getActivationStateForUser(userId),
    prisma.monthlyAutopilotPlan.findUnique({
      where: {
        websiteId_month: {
          websiteId: website.id,
          month,
        },
      },
      select: { status: true },
    }),
  ]);

  if (
    !shouldTriggerPostSubscriptionActivation({
      subscriptionStatus: input.subscriptionStatus,
      activationStatus:
        activation?.websiteId === website.id ? activation.status : null,
      monthlyPlanStatus: monthlyPlan?.status ?? null,
    })
  ) {
    return {
      started: false,
      reason: "not_needed",
      websiteId: website.id,
    };
  }

  try {
    await scheduleWebsiteActivation({
      userId,
      organizationId: input.organizationId,
      websiteId: website.id,
      websiteUrl: website.url,
      source:
        input.source === "billing_sync"
          ? "subscription_sync"
          : "subscription_started",
    });
    safeLogInfo("billing.activation", "Post-subscription activation started", {
      organizationId: input.organizationId,
      websiteId: website.id,
      source: input.source,
    });
    return { started: true, websiteId: website.id };
  } catch (error) {
    safeLogWarn("billing.activation", "Post-subscription activation failed", {
      organizationId: input.organizationId,
      websiteId: website.id,
      source: input.source,
      message: error instanceof Error ? error.message : "activation_failed",
    });
    return { started: false, reason: "activation_failed", websiteId: website.id };
  }
}

