import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import { getAutopilotControlCenter } from "@/lib/autopilot-control/get-control-center";
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
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);

    const controlCenter = await getAutopilotControlCenter({
      currentUser,
      websiteId: url.searchParams.get("websiteId"),
    });

    return authJsonResponse({ data: { controlCenter } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
