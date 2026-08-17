import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse, parseJsonBody, validationErrorFromZod } from "@/lib/auth/responses";
import { runScheduledAutopilotPlans } from "@/lib/autopilot/run-scheduled-plan";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { beginCustomWebhookPublication } from "@/lib/publishing/prepare-publishing-handoff";

const OWNER_DASHBOARD_EMAILS = new Set(["dmitri.ivkin@gmail.com"]);

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("RUN_CYCLE"), websiteId: z.string().uuid(), dryRun: z.boolean().optional() }),
  z.object({ action: z.literal("RETRY_JOB"), jobId: z.string().uuid() }),
]);

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    if (user.role !== "admin" && !OWNER_DASHBOARD_EMAILS.has(user.email)) {
      throw new AppError(ErrorCode.FORBIDDEN, "Требуются права администратора");
    }
    const parsed = bodySchema.safeParse(await parseJsonBody(request));
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    const prisma = getPrisma();

    if (parsed.data.action === "RUN_CYCLE") {
      const plan = await prisma.monthlyAutopilotPlan.findFirst({
        where: { websiteId: parsed.data.websiteId, archivedAt: null },
        orderBy: { month: "desc" },
        select: { userId: true, organizationId: true, websiteId: true },
      });
      if (!plan) throw new AppError(ErrorCode.NOT_FOUND, "Autopilot plan not found");
      const report = await runScheduledAutopilotPlans({
        userId: plan.userId,
        organizationId: plan.organizationId,
        websiteId: plan.websiteId,
        dryRun: parsed.data.dryRun === true,
      });
      return authJsonResponse({ data: { action: parsed.data.action, report } });
    }

    const job = await prisma.integrationExecutionJob.findUnique({
      where: { id: parsed.data.jobId },
      include: { website: { select: { organization: { select: { ownerUserId: true } } } } },
    });
    if (!job) throw new AppError(ErrorCode.NOT_FOUND, "Execution job not found");
    if (job.status !== "FAILED") throw new AppError(ErrorCode.VALIDATION_ERROR, "Only failed jobs can be retried");
    if (job.provider !== "CUSTOM_WEBHOOK" || job.action !== "SEND_WEBHOOK" || !job.integrationId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This provider does not support an admin retry yet");
    }
    const preview = record(job.requestPreviewJson);
    const delivered = await beginCustomWebhookPublication({
      articleId: job.sourceId,
      websiteId: job.websiteId,
      organizationId: job.organizationId,
      userId: job.requestedByUserId ?? job.website.organization.ownerUserId,
      integrationId: job.integrationId,
      planId: typeof preview.planId === "string" ? preview.planId : undefined,
      planItemId: typeof preview.planItemId === "string" ? preview.planItemId : undefined,
      mode: job.mode,
    });
    return authJsonResponse({ data: { action: parsed.data.action, jobId: job.id, retried: delivered } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
