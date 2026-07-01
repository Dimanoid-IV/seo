import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

import { getRefreshTokenFromCookies } from "./cookies";
import { localeToAuthLocale, userRoleToAuthRole } from "./mappers";
import { verifyRefreshToken } from "./tokens";
import { getCurrentUserFromRequest } from "./current-user";
import type { CurrentUser } from "./types";

/**
 * Resolves the current user for browser redirects (OAuth connect).
 * Tries Bearer token first, then HttpOnly refresh cookie.
 */
export async function requireUserFromSession(
  request: Request
): Promise<CurrentUser> {
  assertServerOnly();

  const fromBearer = await getCurrentUserFromRequest(request);
  if (fromBearer) {
    return fromBearer;
  }

  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Требуется авторизация");
  }

  const databaseUrl = getServerEnv().DATABASE_URL;
  if (!databaseUrl) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(ErrorCode.UNAUTHORIZED, "Недействительная сессия", {
      cause: error,
    });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      locale: true,
      emailVerified: true,
    },
  });

  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Пользователь не найден или удалён");
  }

  return {
    id: payload.userId,
    email: user.email,
    name: user.name,
    role: userRoleToAuthRole(user.role),
    locale: localeToAuthLocale(user.locale),
    organizationId: payload.organizationId,
    emailVerified: user.emailVerified,
  };
}
