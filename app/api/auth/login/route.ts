import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { loginUser } from "@/lib/auth/service";
import { loginSchema } from "@/lib/validators/auth";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

// TODO: rate limit — 10 login attempts / min / IP (docs/API-Design.md)

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const body = await parseJsonBody(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await loginUser(parsed.data.email, parsed.data.password);

    return authJsonResponse(
      {
        user: result.user,
        organization: result.organization,
        subscription: result.subscription,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      { refreshToken: result.refreshToken }
    );
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
