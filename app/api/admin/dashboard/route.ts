import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getAdminGrowthDashboard } from "@/lib/admin/growth-dashboard";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

const OWNER_DASHBOARD_EMAILS = new Set(["dmitri.ivkin@gmail.com"]);

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Database is not configured.", {
      statusCode: 503,
    });
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const user = await requireUser(request);

    if (user.role !== "admin" && !OWNER_DASHBOARD_EMAILS.has(user.email)) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Требуются права администратора"
      );
    }

    const url = new URL(request.url);
    const days = Number.parseInt(url.searchParams.get("days") || "30", 10);
    const data = await getAdminGrowthDashboard(days);

    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
