import { MonthlyAutopilotStatus } from "@prisma/client";

import { runScheduledAutopilotPlans } from "@/lib/autopilot/run-scheduled-plan";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
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
          itemTitle: result.itemTitle,
          action: result.action,
          reasonKey: result.reasonKey,
          eligible: result.eligible,
          executed: result.executed,
          error: result.error,
        })),
      });
    }

    return Response.json({
      data: {
        plansProcessed: plans.length,
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
