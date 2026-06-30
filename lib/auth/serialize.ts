import type {
  Organization,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
  Website,
} from "@prisma/client";

import { localeToAuthLocale, userRoleToAuthRole } from "./mappers";

export function serializeUser(
  user: Pick<User, "id" | "email" | "name" | "locale" | "emailVerified" | "role">
) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    locale: localeToAuthLocale(user.locale),
    emailVerified: user.emailVerified,
    role: userRoleToAuthRole(user.role),
  };
}

export function serializeOrganization(org: Pick<Organization, "id" | "name">) {
  return {
    id: org.id,
    name: org.name,
  };
}

export function serializeWebsite(
  website: Pick<Website, "id" | "url" | "displayName">
) {
  return {
    id: website.id,
    url: website.url,
    displayName: website.displayName,
  };
}

function planToApi(plan: SubscriptionPlan): string {
  return plan.toLowerCase();
}

function statusToApi(status: SubscriptionStatus): string {
  return status.toLowerCase();
}

export function serializeSubscription(
  subscription: Pick<
    Subscription,
    "id" | "plan" | "status" | "currentPeriodEnd" | "currentPeriodStart"
  >
) {
  return {
    id: subscription.id,
    plan: planToApi(subscription.plan),
    status: statusToApi(subscription.status),
    currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
  };
}
