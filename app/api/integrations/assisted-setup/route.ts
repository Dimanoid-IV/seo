import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { createAssistedSetupRequest } from "@/lib/integrations/assisted-setup";
import { assistedSetupFormSchema } from "@/lib/validators";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = assistedSetupFormSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    if (parsed.data.honeypot?.trim()) {
      return authJsonResponse({ data: { success: true } });
    }

    const result = await createAssistedSetupRequest({
      data: parsed.data,
      userId: currentUser.id,
      websiteId: parsed.data.websiteId ?? null,
    });

    return authJsonResponse({
      data: {
        success: true,
        requestId: result.id,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
