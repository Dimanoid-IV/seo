import {
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import type { GoogleTokenResponse, GoogleUserProfile } from "@/lib/google/oauth";
import { encryptSecret } from "@/lib/security/encryption";

type ConnectGscIntegrationInput = {
  currentUser: CurrentUser;
  websiteId: string;
  organizationId: string;
  tokens: GoogleTokenResponse;
  googleUser: GoogleUserProfile;
};

/**
 * Creates or updates a Google Search Console Integration after OAuth callback.
 */
export async function connectGscIntegration({
  currentUser,
  websiteId,
  organizationId,
  tokens,
  googleUser,
}: ConnectGscIntegrationInput) {
  const prisma = getPrisma();

  const website = await prisma.website.findFirst({
    where: {
      id: websiteId,
      organizationId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    select: { id: true, organizationId: true },
  });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: organizationId,
      deletedAt: null,
      ownerUserId: currentUser.id,
    },
    select: { id: true },
  });

  if (!organization) {
    throw new AppError(ErrorCode.FORBIDDEN, "Нет доступа к организации");
  }

  const accessTokenEncrypted = encryptSecret(tokens.access_token);
  const refreshTokenEncrypted = tokens.refresh_token
    ? encryptSecret(tokens.refresh_token)
    : undefined;

  const scopes = tokens.scope
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);

  const displayName =
    googleUser.name?.trim() ||
    googleUser.email?.trim() ||
    "Google Search Console";

  const integration = await prisma.integration.upsert({
    where: {
      websiteId_provider: {
        websiteId: website.id,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
    },
    create: {
      websiteId: website.id,
      organizationId: website.organizationId,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      status: IntegrationStatus.CONNECTED,
      displayName,
      scopesJson: scopes,
      accessTokenEncrypted,
      refreshTokenEncrypted: refreshTokenEncrypted ?? null,
      lastSyncAt: null,
      disconnectedAt: null,
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      displayName,
      scopesJson: scopes,
      accessTokenEncrypted,
      refreshTokenEncrypted: refreshTokenEncrypted ?? undefined,
      lastSyncAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      disconnectedAt: null,
    },
  });

  try {
    const { timelineAfterIntegrationConnected } = await import(
      "@/lib/timeline/hooks"
    );
    await timelineAfterIntegrationConnected({
      userId: currentUser.id,
      websiteId: website.id,
      integrationKey: "gsc",
      label: "Google Search Console",
    });
  } catch {
    // Timeline sync must not block integration connect.
  }

  return integration;
}

/**
 * Resolves the active website for OAuth connect.
 */
export async function resolveWebsiteForOAuth(
  currentUser: CurrentUser,
  websiteId?: string | null
) {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Организация не найдена");
  }

  const website = websiteId
    ? await prisma.website.findFirst({
        where: {
          id: websiteId,
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        select: { id: true, organizationId: true, url: true },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, organizationId: true, url: true },
      });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Добавьте сайт, чтобы подключить Google Search Console"
    );
  }

  return {
    website,
    organizationId: organization.id,
  };
}
