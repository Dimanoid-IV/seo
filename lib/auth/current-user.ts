import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertServerOnly } from "@/lib/security";

import { assertSaasConfigured } from "./saas-config";

import { localeToAuthLocale, userRoleToAuthRole } from "./mappers";
import { verifyAccessToken } from "./tokens";
import type { AuthTokenPayload, CurrentUser } from "./types";

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function mapPayloadToCurrentUser(
  payload: AuthTokenPayload,
  user: {
    email: string;
    name: string | null;
    role: Parameters<typeof userRoleToAuthRole>[0];
    locale: Parameters<typeof localeToAuthLocale>[0];
    emailVerified: boolean;
  }
): CurrentUser {
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

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
}

/**
 * Resolves the current user from Authorization: Bearer access token.
 * Returns null when no token is present or token is invalid/expired.
 */
export async function getCurrentUserFromRequest(
  request: Request
): Promise<CurrentUser | null> {
  assertServerOnly();

  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  let payload: AuthTokenPayload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    return null;
  }

  assertDatabaseConfigured();

  let prisma;
  try {
    prisma = getPrisma();
  } catch (error) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось подключиться к базе данных. Проверьте DATABASE_URL.",
      { cause: error, statusCode: 503 }
    );
  }

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
    return null;
  }

  return mapPayloadToCurrentUser(payload, user);
}

/**
 * Requires an authenticated user. Throws UNAUTHORIZED if missing or invalid.
 */
export async function requireUser(request: Request): Promise<CurrentUser> {
  assertServerOnly();

  const token = extractBearerToken(request);
  if (!token) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Требуется авторизация. Передайте Authorization: Bearer <access_token>."
    );
  }

  let payload: AuthTokenPayload;
  try {
    payload = await verifyAccessToken(token);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Недействительный или просроченный access token",
      { cause: error }
    );
  }

  assertDatabaseConfigured();

  let prisma;
  try {
    prisma = getPrisma();
  } catch (error) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Не удалось подключиться к базе данных. Проверьте DATABASE_URL.",
      { cause: error, statusCode: 503 }
    );
  }

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

  return mapPayloadToCurrentUser(payload, user);
}

/**
 * Requires an authenticated admin user. Throws FORBIDDEN for non-admin roles.
 */
export async function requireAdmin(request: Request): Promise<CurrentUser> {
  const user = await requireUser(request);

  if (user.role !== "admin") {
    throw new AppError(ErrorCode.FORBIDDEN, "Требуются права администратора");
  }

  return user;
}
