import { requireAdmin } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { FUNNEL_STEPS } from "@/lib/analytics/types";
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

/**
 * Admin-only funnel aggregates (last N days). Counts only — no propertiesJson.
 */
export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    await requireAdmin(request);

    const url = new URL(request.url);
    const days = Math.min(
      Math.max(Number.parseInt(url.searchParams.get("days") || "7", 10) || 7, 1),
      90
    );
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const prisma = getPrisma();

    const grouped = await prisma.productEvent.groupBy({
      by: ["event"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    for (const row of grouped) {
      counts[row.event] = row._count._all;
    }

    const funnel = FUNNEL_STEPS.map((step, index) => {
      const count = counts[step] ?? 0;
      const prev = index === 0 ? null : (counts[FUNNEL_STEPS[index - 1]] ?? 0);
      const dropOffRate =
        prev == null || prev === 0
          ? null
          : Math.max(0, Math.round((1 - count / prev) * 100));
      return { step, count, dropOffRate };
    });

    const byRoute = await prisma.productEvent.groupBy({
      by: ["route"],
      where: { createdAt: { gte: since }, route: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { route: "desc" } },
      take: 30,
    });

    return authJsonResponse({
      data: {
        days,
        since: since.toISOString(),
        funnel,
        highlights: {
          activationFailures: counts.activation_step_failed ?? 0,
          qualityPassed: counts.article_quality_passed ?? 0,
          qualityFailed: counts.article_quality_failed ?? 0,
          exportClicks: counts.article_export_clicked ?? 0,
          checkoutStarts: counts.checkout_started ?? 0,
        },
        byRoute: byRoute.map((row) => ({
          route: row.route,
          count: row._count._all,
        })),
        totals: counts,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
