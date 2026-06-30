import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getRefreshTokenFromCookies } from "@/lib/auth/cookies";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import { refreshAuthSession } from "@/lib/auth/service";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const refreshToken = await getRefreshTokenFromCookies();
    if (!refreshToken) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Refresh token не найден в cookie"
      );
    }

    const result = await refreshAuthSession(refreshToken);

    return authJsonResponse(
      {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      { refreshToken: result.refreshToken }
    );
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
