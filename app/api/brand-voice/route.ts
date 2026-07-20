import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  getBrandVoiceForUser,
  updateBrandVoiceForUser,
} from "@/lib/brand-voice/service";
import type { BrandVoiceManualPatch } from "@/lib/brand-voice/types";

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

    const result = await getBrandVoiceForUser(currentUser, websiteId);
    return authJsonResponse({
      data: {
        profile: result.profile,
        brandKit: result.brandKit,
        website: result.website,
        hasStoredProfile: result.hasStoredProfile,
      },
    });
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
      patch?: BrandVoiceManualPatch;
    };

    if (!body.patch || typeof body.patch !== "object") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "patch is required");
    }

    const profile = await updateBrandVoiceForUser(
      currentUser,
      body.patch,
      body.websiteId
    );
    return authJsonResponse({ data: { profile } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
