import { MonthlyAutopilotStatus } from "@prisma/client";

import { runScheduledAutopilotPlans } from "@/lib/autopilot/run-scheduled-plan";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

/** Cap websites processed per cron invocation to avoid runaway Hermes cost. */
const MAX_PLANS_PER_CRON = 25;

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

function summarizeAction(action: string, summaryKey?: string): string {
  const key = summaryKey ?? action;
  switch (key) {
    case "wouldResearch":
    case "readyForResearch":
      return "would_research";
    case "wouldGenerateDraft":
    case "draftWillBePrepared":
    case "readyForDraftPreparation":
      return "would_generate_draft";
    case "wouldCreateWordPressDraft":
    case "wordpressDraftCreated":
      return "would_create_wp_draft";
    case "wouldPrepareUniversalPackage":
    case "universalPackageReady":
      return "would_prepare_universal_package";
    case "wouldPrepareWebhookReady":
    case "webhookReady":
      return "would_prepare_webhook";
    case "wouldSendWebhook":
    case "webhookSent":
      return "would_send_webhook_if_enabled";
    case "qualityFailed":
      return "would_skip_quality_failed";
    default:
      return key;
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    assertDatabaseConfigured();
    const prisma = getPrisma();
    const dryRun = new URL(request.url).searchParams.get("dryRun") === "true";

    const plans = await prisma.monthlyAutopilotPlan.findMany({
      where: {
        archivedAt: null,
        status: MonthlyAutopilotStatus.APPROVED,
      },
      select: {
        id: true,
        userId: true,
        websiteId: true,
        organizationId: true,
      },
      orderBy: { month: "desc" },
      take: MAX_PLANS_PER_CRON,
    });

    const reports = [];

    for (const plan of plans) {
      const report = await runScheduledAutopilotPlans({
        userId: plan.userId,
        organizationId: plan.organizationId,
        websiteId: plan.websiteId,
        dryRun,
      });

      reports.push({
        planId: plan.id,
        websiteId: plan.websiteId,
        dryRun: report.dryRun,
        dueItemsFound: report.dueItemsFound,
        executedCount: report.executedCount,
        skippedCount: report.skippedCount,
        blockedCount: report.blockedCount,
        errorCount: report.errorCount,
        results: report.results.map((result) => ({
          planItemId: result.planItemId,
          // Title only — never article body / webhook URL / secrets.
          itemTitle: result.itemTitle.slice(0, 120),
          action: result.action,
          reasonKey: result.reasonKey,
          would: summarizeAction(result.action, result.summaryKey ?? result.would),
          eligible: result.eligible,
          executed: result.executed,
          error: result.error ? "execution_error" : undefined,
        })),
      });
    }

    return Response.json({
      data: {
        plansProcessed: plans.length,
        maxPlansPerRun: MAX_PLANS_PER_CRON,
        dryRun,
        reports,
      },
    });
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Cron autopilot run failed";

    return Response.json({ error: message }, { status: 500 });
  }
}
