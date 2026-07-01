import {
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { decryptSecret } from "@/lib/security/encryption";

export type ConnectedGscContext = {
  website: {
    id: string;
    url: string;
    organizationId: string;
  };
  integration: {
    id: string;
    accessTokenEncrypted: string;
    lastSuccessAt: Date | null;
  };
  accessToken: string;
  selectedSiteUrl: string | null;
};

/**
 * Resolves the active website and connected GSC integration for the current user.
 */
export async function resolveConnectedGscContext(
  currentUser: CurrentUser
): Promise<ConnectedGscContext> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Организация не найдена");
  }

  const website = await prisma.website.findFirst({
    where: {
      organizationId: organization.id,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      organizationId: true,
    },
  });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Добавьте сайт, чтобы работать с Google Search Console"
    );
  }

  const integration = await prisma.integration.findFirst({
    where: {
      websiteId: website.id,
      provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      status: IntegrationStatus.CONNECTED,
    },
    select: {
      id: true,
      accessTokenEncrypted: true,
      lastSuccessAt: true,
      googleData: {
        select: {
          searchConsoleSiteUrl: true,
        },
      },
    },
  });

  if (!integration?.accessTokenEncrypted) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Google Search Console не подключён для этого сайта"
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptSecret(integration.accessTokenEncrypted);
  } catch (error) {
    throw new AppError(
      ErrorCode.INTEGRATION_ERROR,
      "Не удалось расшифровать токен Google Search Console",
      { cause: error }
    );
  }

  return {
    website,
    integration: {
      id: integration.id,
      accessTokenEncrypted: integration.accessTokenEncrypted,
      lastSuccessAt: integration.lastSuccessAt,
    },
    accessToken,
    selectedSiteUrl: integration.googleData?.searchConsoleSiteUrl ?? null,
  };
}
