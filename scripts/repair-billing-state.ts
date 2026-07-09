import "dotenv/config";

import { reconcileLegacyBillingState } from "../lib/billing/stripe-legacy";
import { getPrisma } from "../lib/db";

function parseArgs(argv: string[]) {
  const emailArg = argv.find((arg) => arg.startsWith("--email="));
  const orgArg = argv.find((arg) => arg.startsWith("--org-id="));
  const confirm = argv.includes("--confirm");

  return {
    email: emailArg?.slice("--email=".length).trim() ?? "",
    organizationId: orgArg?.slice("--org-id=".length).trim() ?? "",
    confirm,
  };
}

async function main() {
  const { email, organizationId, confirm } = parseArgs(process.argv.slice(2));

  if (!confirm) {
    console.error("Refusing to run without --confirm");
    process.exit(1);
  }

  if (!email && !organizationId) {
    console.error("Provide --email=<address> or --org-id=<uuid>");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const prisma = getPrisma();

  const organization = organizationId
    ? await prisma.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
        select: {
          id: true,
          name: true,
          ownerUserId: true,
          owner: { select: { email: true } },
        },
      })
    : await prisma.organization.findFirst({
        where: {
          deletedAt: null,
          owner: { email, deletedAt: null },
        },
        select: {
          id: true,
          name: true,
          ownerUserId: true,
          owner: { select: { email: true } },
        },
      });

  if (!organization?.ownerUserId) {
    console.error("Organization not found for the provided selector");
    process.exit(1);
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
    },
  });

  console.log("Target organization:", organization.id, organization.name);
  console.log("Target user:", organization.owner.email);
  console.log("Current subscription:", subscription);

  const result = await reconcileLegacyBillingState({
    userId: organization.ownerUserId,
    organizationId: organization.id,
  });

  const updated = await prisma.subscription.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
    },
  });

  console.log("Repair result:", result);
  console.log("Updated subscription:", updated);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Repair failed");
  process.exit(1);
});
