import type { PrismaClient } from "@prisma/client";
import { SubscriptionStatus } from "@prisma/client";

type DbClient = Pick<PrismaClient, "organization" | "subscription">;

export function monthPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return { start, end };
}

export async function findPrimaryOrganization(
  db: DbClient,
  userId: string
) {
  return db.organization.findFirst({
    where: {
      ownerUserId: userId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function findActiveSubscription(
  db: DbClient,
  organizationId: string
) {
  return db.subscription.findFirst({
    where: {
      organizationId,
      deletedAt: null,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.PAST_DUE,
          SubscriptionStatus.INCOMPLETE,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
