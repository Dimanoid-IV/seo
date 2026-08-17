import { z } from "zod";

import { authErrorResponse, authJsonResponse, validationErrorFromZod } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getWordPressPingSecret, handleWordPressPing } from "@/lib/integrations/wordpress-connector";
import { verifyWordPressPingSignature } from "@/lib/integrations/wordpress-ping-signature";

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

    const rawBody = await request.text();
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный JSON в теле запроса");
    }
    const parsed = pingSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const secret = await getWordPressPingSecret(apiKey);
    const signatureValid = verifyWordPressPingSignature({
      body: rawBody,
      secret,
      timestamp: request.headers.get("x-rankboost-timestamp"),
      signature: request.headers.get("x-rankboost-signature"),
    });
    if (!signatureValid) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Недействительная или просроченная подпись запроса");
    }

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
