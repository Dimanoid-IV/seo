import { z } from "zod";

import { authErrorResponse, authJsonResponse, parseJsonBody, validationErrorFromZod } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { handleWordPressPing } from "@/lib/integrations/wordpress-connector";

const pingSchema = z.object({
  siteUrl: z.string().min(1),
  pluginVersion: z.string().min(1),
});

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

function getApiKeyFromRequest(request: Request): string | null {
  const headerKey = request.headers.get("x-rankboost-key")?.trim();
  if (headerKey) {
    return headerKey;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const apiKey = getApiKeyFromRequest(request);
    if (!apiKey) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Передайте API key в заголовке X-RankBoost-Key"
      );
    }

    const body = await parseJsonBody(request);
    const parsed = pingSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    // TODO: verify HMAC signature (X-RankBoost-Signature + X-RankBoost-Timestamp).

    const result = await handleWordPressPing({
      apiKey,
      siteUrl: parsed.data.siteUrl,
      pluginVersion: parsed.data.pluginVersion,
    });

    return authJsonResponse(result);
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
