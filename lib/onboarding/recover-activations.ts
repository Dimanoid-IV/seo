import "server-only";
import { getPrisma } from "@/lib/db";
import { readActivationFromMetadata } from "./activation-state-pure";
import { activationNeedsRecovery, ACTIVATION_LEASE_MS } from "./activation-recovery";
import { runActivationPipelineSafe } from "./activation-pipeline";

/** Durable recovery also runs when the client has closed their browser. */
export async function recoverStalledActivations() {
  const prisma = getPrisma();
  const rows = await prisma.onboardingState.findMany({
    where: {
      updatedAt: { lt: new Date(Date.now() - ACTIVATION_LEASE_MS) },
      OR: ["running", "partial", "failed"].map(status => ({ metadata: { path: ["activation", "status"], equals: status } })),
    },
    orderBy: { updatedAt: "asc" }, take: 5,
    select: { userId: true, metadata: true },
  });
  for (const row of rows) {
    const state = readActivationFromMetadata(row.metadata);
    if (!state || !activationNeedsRecovery(state)) continue;
    const website = await prisma.website.findFirst({
      where: { id: state.websiteId, deletedAt: null, status: "ACTIVE", organization: { deletedAt: null, ownerUserId: row.userId } },
      select: { id: true, url: true, organizationId: true },
    });
    if (!website) continue;
    const result = await runActivationPipelineSafe({ userId: row.userId, organizationId: website.organizationId, websiteId: website.id, websiteUrl: website.url });
    return { recovered: result?.activation.status === "done", websiteId: website.id, status: result?.activation.status ?? "busy" };
  }
  return { recovered: false };
}
