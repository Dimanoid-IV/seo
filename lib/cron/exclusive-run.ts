import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

export function cronBucketKey(jobKey: string, now: Date, bucketMs: number): string {
  return `${jobKey}:${Math.floor(now.getTime() / bucketMs)}`;
}

export async function runExclusiveCron<T>(input: {
  jobKey: string;
  now?: Date;
  leaseMs: number;
  bucketMs: number;
  run: () => Promise<T>;
  summarize?: (data: T) => Prisma.InputJsonValue | Promise<Prisma.InputJsonValue>;
  isFailure?: (data: T) => boolean;
}): Promise<{ ran: false; reason: "already_running_or_completed" } | { ran: true; data: T }> {
  const prisma = getPrisma();
  const now = input.now ?? new Date();
  const owner = randomUUID();
  const expiresAt = new Date(now.getTime() + input.leaseMs);
  const claimed = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
    INSERT INTO "job_leases" ("key", "owner", "expiresAt", "heartbeatAt", "createdAt", "updatedAt")
    VALUES (${input.jobKey}, ${owner}, ${expiresAt}, ${now}, ${now}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "owner" = EXCLUDED."owner",
      "expiresAt" = EXCLUDED."expiresAt",
      "heartbeatAt" = EXCLUDED."heartbeatAt",
      "updatedAt" = EXCLUDED."updatedAt"
    WHERE "job_leases"."expiresAt" <= ${now}
    RETURNING "key"
  `);
  if (claimed.length === 0) return { ran: false, reason: "already_running_or_completed" };

  const idempotencyKey = cronBucketKey(input.jobKey, now, input.bucketMs);
  let cronRun: { id: string };
  try {
    cronRun = await prisma.cronRun.create({
      data: { jobKey: input.jobKey, idempotencyKey, status: "RUNNING", startedAt: now },
      select: { id: true },
    });
  } catch (error) {
    await prisma.jobLease.deleteMany({ where: { key: input.jobKey, owner } });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ran: false, reason: "already_running_or_completed" };
    }
    throw error;
  }

  try {
    const data = await input.run();
    const finishedAt = new Date();
    const failed = input.isFailure?.(data) === true;
    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        status: failed ? "FAILED" : "SUCCEEDED",
        finishedAt,
        durationMs: finishedAt.getTime() - now.getTime(),
        reportJson: input.summarize
          ? await input.summarize(data)
          : (data as Prisma.InputJsonValue),
        errorCode: failed ? "CRON_RESPONSE_FAILED" : null,
      },
    });
    return { ran: true, data };
  } catch (error) {
    const finishedAt = new Date();
    await prisma.cronRun.update({
      where: { id: cronRun.id },
      data: {
        status: "FAILED",
        finishedAt,
        durationMs: finishedAt.getTime() - now.getTime(),
        errorCode: "CRON_EXECUTION_FAILED",
        errorMessage: error instanceof Error ? error.message.slice(0, 1000) : "Cron execution failed",
      },
    });
    throw error;
  } finally {
    await prisma.jobLease.deleteMany({ where: { key: input.jobKey, owner } });
  }
}
