import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  resolveExecutionJobActions,
  retryFailedWordPressPublishJob,
  rollbackFromPublishJob,
} from "@/lib/integrations/execution-actions";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = { params: Promise<{ jobId: string }> };

async function assertOwnedJob(userId: string, organizationId: string | null, jobId: string) {
  const prisma = getPrisma();
  const job = await prisma.integrationExecutionJob.findFirst({
    where: {
      id: jobId,
      website: {
        deletedAt: null,
        organization: {
          ownerUserId: userId,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      organizationId: true,
      websiteId: true,
      action: true,
      status: true,
      provider: true,
      sourceType: true,
      sourceId: true,
    },
  });
  if (!job) {
    throw new AppError(ErrorCode.NOT_FOUND, "Execution job not found");
  }
  if (organizationId && organizationId !== job.organizationId) {
    throw new AppError(ErrorCode.NOT_FOUND, "Execution job not found");
  }
  return job;
}

/**
 * GET /api/integrations/executions/[jobId]
 * Returns job + available safe actions (retry / rollback).
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { jobId } = await context.params;
    const job = await assertOwnedJob(
      currentUser.id,
      currentUser.organizationId,
      jobId
    );
    const actions = resolveExecutionJobActions(job);
    return authJsonResponse({
      data: {
        job: {
          id: job.id,
          action: job.action,
          status: job.status,
          provider: job.provider,
          sourceType: job.sourceType,
          sourceId: job.sourceId,
        },
        actions,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

const actionSchema = z.object({
  action: z.enum(["retry", "rollback"]),
  targetStatus: z.enum(["draft", "private"]).optional(),
});

/**
 * POST /api/integrations/executions/[jobId]
 * Body: { action: "retry" | "rollback", targetStatus?: "draft" | "private" }
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { jobId } = await context.params;
    const job = await assertOwnedJob(
      currentUser.id,
      currentUser.organizationId,
      jobId
    );
    const body = await parseJsonBody(request);
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    if (parsed.data.action === "retry") {
      const result = await retryFailedWordPressPublishJob({
        userId: currentUser.id,
        organizationId: job.organizationId,
        jobId: job.id,
      });
      return authJsonResponse({ data: { action: "retry", ...result } });
    }

    const result = await rollbackFromPublishJob({
      userId: currentUser.id,
      organizationId: job.organizationId,
      jobId: job.id,
      targetStatus: parsed.data.targetStatus ?? "draft",
    });
    return authJsonResponse({ data: { action: "rollback", ...result } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
