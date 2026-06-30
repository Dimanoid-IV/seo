import {
  OrganizationStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  WebsiteLanguage,
  WebsiteStatus,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { authLocaleToPrismaLocale, localeToAuthLocale, userRoleToAuthRole } from "./mappers";
import { hashPassword, validatePasswordStrength, verifyPassword } from "./password";
import {
  findActiveSubscription,
  findPrimaryOrganization,
  monthPeriod,
} from "./queries";
import {
  serializeOrganization,
  serializeSubscription,
  serializeUser,
  serializeWebsite,
} from "./serialize";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "./tokens";
import type { AuthTokenClaims } from "./types";
import {
  normalizeWebsiteUrl,
  type RegisterInput,
} from "@/lib/validators/auth";

function buildTokenClaims(
  user: {
    id: string;
    role: Parameters<typeof userRoleToAuthRole>[0];
    locale: Parameters<typeof localeToAuthLocale>[0];
  },
  organizationId: string | null
): AuthTokenClaims {
  return {
    userId: user.id,
    organizationId,
    role: userRoleToAuthRole(user.role),
    locale: localeToAuthLocale(user.locale),
  };
}

async function issueAuthTokens(
  user: {
    id: string;
    role: Parameters<typeof userRoleToAuthRole>[0];
    locale: Parameters<typeof localeToAuthLocale>[0];
  },
  organizationId: string | null
) {
  const claims = buildTokenClaims(user, organizationId);
  const { token: accessToken, expiresIn } = await createAccessToken(claims);
  const refreshToken = await createRefreshToken(claims);
  return { accessToken, expiresIn, refreshToken };
}

export async function registerUser(input: RegisterInput) {
  const strength = validatePasswordStrength(input.password);
  if (!strength.valid) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, strength.errors[0] ?? "Слабый пароль", {
      details: { errors: strength.errors },
    });
  }

  const prisma = getPrisma();
  const prismaLocale = authLocaleToPrismaLocale(input.locale);
  const websiteUrl = input.websiteUrl?.trim()
    ? normalizeWebsiteUrl(input.websiteUrl)
    : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser && existingUser.deletedAt === null) {
        throw new AppError(ErrorCode.CONFLICT, "Email уже зарегистрирован");
      }

      if (existingUser?.deletedAt) {
        throw new AppError(
          ErrorCode.CONFLICT,
          "Email недоступен для регистрации. Обратитесь в поддержку."
        );
      }

      const passwordHash = await hashPassword(input.password);

      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          name: input.name,
          locale: prismaLocale,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: input.name,
          ownerUserId: user.id,
          billingUserId: user.id,
          status: OrganizationStatus.ACTIVE,
        },
      });

      let website = null;
      if (websiteUrl) {
        website = await tx.website.create({
          data: {
            organizationId: organization.id,
            url: websiteUrl,
            displayName: websiteUrl.replace(/^https?:\/\//, ""),
            primaryLanguage:
              prismaLocale === "RU"
                ? WebsiteLanguage.RU
                : prismaLocale === "ET"
                  ? WebsiteLanguage.ET
                  : WebsiteLanguage.EN,
            contentLanguages: [input.locale],
            status: WebsiteStatus.ACTIVE,
          },
        });
      }

      const { start, end } = monthPeriod();

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
      });

      await tx.planLimit.create({
        data: {
          subscriptionId: subscription.id,
          organizationId: organization.id,
          periodStart: start,
          periodEnd: end,
          auditsLimit: 1,
          articlesLimit: 0,
          socialPostsLimit: 0,
          websitesLimit: 1,
        },
      });

      return { user, organization, website, subscription };
    });

    const tokens = await issueAuthTokens(result.user, result.organization.id);

    return {
      user: serializeUser(result.user),
      organization: serializeOrganization(result.organization),
      website: result.website ? serializeWebsite(result.website) : null,
      subscription: serializeSubscription(result.subscription),
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(ErrorCode.CONFLICT, "Email уже зарегистрирован");
    }
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  const prisma = getPrisma();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.deletedAt !== null) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Неверный email или пароль");
  }

  if (!user.passwordHash) {
    throw new AppError(
      ErrorCode.UNAUTHORIZED,
      "Use Google login",
      { details: { reason: "oauth_only_account" } }
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Неверный email или пароль");
  }

  const organization = await findPrimaryOrganization(prisma, user.id);
  const subscription = organization
    ? await findActiveSubscription(prisma, organization.id)
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueAuthTokens(user, organization?.id ?? null);

  return {
    user: serializeUser(user),
    organization: organization ? serializeOrganization(organization) : null,
    subscription: subscription ? serializeSubscription(subscription) : null,
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
    refreshToken: tokens.refreshToken,
  };
}

export async function refreshAuthSession(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);

  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      id: payload.userId,
      deletedAt: null,
    },
  });

  if (!user) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Пользователь не найден или удалён");
  }

  let organizationId = payload.organizationId;
  if (!organizationId) {
    const organization = await findPrimaryOrganization(prisma, user.id);
    organizationId = organization?.id ?? null;
  }

  const claims = buildTokenClaims(user, organizationId);
  const { token: accessToken, expiresIn } = await createAccessToken(claims);
  const newRefreshToken = await createRefreshToken(claims);

  return { accessToken, expiresIn, refreshToken: newRefreshToken };
}
