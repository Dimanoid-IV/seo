import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import {
  getCompetitorSettingsForUser,
  updateCompetitorSettingsForUser,
} from "@/lib/content-research/competitor-settings";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    const data = await getCompetitorSettingsForUser({
      currentUser,
      websiteId,
    });
    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PUT(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = (await request.json()) as {
      websiteId?: string;
      competitors?: unknown;
    };

    if (!Array.isArray(body.competitors)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "competitors is required");
    }

    const competitors = body.competitors
      .filter((item): item is string => typeof item === "string")
      .slice(0, 20);

    const data = await updateCompetitorSettingsForUser({
      currentUser,
      websiteId: body.websiteId,
      competitors,
    });

    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
