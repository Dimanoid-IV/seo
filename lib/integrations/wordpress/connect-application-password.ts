/**
 * Connect / test / disconnect WordPress via Application Password (no plugin required).
 */
import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  WordPressConnectionStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { encryptSecret, decryptSecret } from "@/lib/security/encryption";
import { hashSecret } from "@/lib/security";
import { assertSafeWordPressUrl } from "./normalize-url";
import {
  parseWordPressPermissionsExtended,
  type WordPressPermissionsExtended,
} from "./permissions";
import { testWordPressApplicationPassword } from "./rest-client";

export type ApplicationPasswordConnectInput = {
  websiteId: string;
  organizationId: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  defaultCategoryIds?: number[];
  defaultAuthorId?: number | null;
  /** When true, persist as CONNECTED after successful test. */
  save: boolean;
};

export type ApplicationPasswordConnectResult = {
  tested: true;
  saved: boolean;
  siteUrl: string;
  httpsWarning: boolean;
  userLogin: string;
  connectionId?: string;
  status?: WordPressConnectionStatus;
};

function buildAppPasswordKeyHash(
  websiteId: string,
  siteUrl: string,
  username: string
): string {
  return hashSecret(`app_password:${websiteId}:${siteUrl}:${username}`);
}

export async function testAndOptionallySaveApplicationPassword(
  input: ApplicationPasswordConnectInput
): Promise<ApplicationPasswordConnectResult> {
  const username = input.username.trim();
  const applicationPassword = input.applicationPassword.trim();
  if (!username || !applicationPassword) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Укажите имя пользователя и Application Password."
    );
  }

  const test = await testWordPressApplicationPassword({
    siteUrl: input.siteUrl,
    username,
    applicationPassword,
  });

  if (!input.save) {
    return {
      tested: true,
      saved: false,
      siteUrl: test.siteUrl,
      httpsWarning: test.httpsWarning,
      userLogin: test.userLogin,
    };
  }

  const prisma = getPrisma();
  const permissions: WordPressPermissionsExtended = {
    canCreateDrafts: true,
    canUpdateMeta: true,
    canPublish: false,
    authMode: "application_password",
    username,
    defaultCategoryIds: input.defaultCategoryIds ?? [],
    defaultAuthorId: input.defaultAuthorId ?? test.userId,
    httpsWarning: test.httpsWarning,
  };

  const apiKeyHash = buildAppPasswordKeyHash(
    input.websiteId,
    test.siteUrl,
    username
  );
  const apiSecretEncrypted = encryptSecret(applicationPassword);

  // Disconnect any other active connections for this website first.
  await prisma.wordPressConnection.updateMany({
    where: {
      websiteId: input.websiteId,
      disconnectedAt: null,
      status: {
        in: [
          WordPressConnectionStatus.PENDING,
          WordPressConnectionStatus.CONNECTED,
          WordPressConnectionStatus.ERROR,
        ],
      },
    },
    data: {
      status: WordPressConnectionStatus.DISCONNECTED,
      disconnectedAt: new Date(),
    },
  });

  const existing = await prisma.wordPressConnection.findFirst({
    where: {
      websiteId: input.websiteId,
      siteUrl: test.siteUrl,
    },
    select: { id: true },
  });

  const connection = existing
    ? await prisma.wordPressConnection.update({
        where: { id: existing.id },
        data: {
          status: WordPressConnectionStatus.CONNECTED,
          apiKeyHash,
          apiSecretEncrypted,
          permissionsJson: permissions as unknown as Prisma.InputJsonValue,
          pluginVersion: null,
          lastPingAt: new Date(),
          disconnectedAt: null,
        },
        select: { id: true, status: true },
      })
    : await prisma.wordPressConnection.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          siteUrl: test.siteUrl,
          status: WordPressConnectionStatus.CONNECTED,
          apiKeyHash,
          apiSecretEncrypted,
          permissionsJson: permissions as unknown as Prisma.InputJsonValue,
          lastPingAt: new Date(),
        },
        select: { id: true, status: true },
      });

  await prisma.integration.upsert({
    where: {
      websiteId_provider: {
        websiteId: input.websiteId,
        provider: IntegrationProvider.WORDPRESS,
      },
    },
    create: {
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      provider: IntegrationProvider.WORDPRESS,
      status: IntegrationStatus.CONNECTED,
      displayName: "WordPress",
      lastSuccessAt: new Date(),
      disconnectedAt: null,
    },
    update: {
      status: IntegrationStatus.CONNECTED,
      lastSuccessAt: new Date(),
      disconnectedAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
    },
  });

  return {
    tested: true,
    saved: true,
    siteUrl: test.siteUrl,
    httpsWarning: test.httpsWarning,
    userLogin: test.userLogin,
    connectionId: connection.id,
    status: connection.status,
  };
}

export async function disconnectWordPressConnection(input: {
  websiteId: string;
  organizationId: string;
}): Promise<void> {
  const prisma = getPrisma();
  const now = new Date();

  await prisma.wordPressConnection.updateMany({
    where: {
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      disconnectedAt: null,
    },
    data: {
      status: WordPressConnectionStatus.DISCONNECTED,
      disconnectedAt: now,
      apiSecretEncrypted: null,
    },
  });

  await prisma.integration.updateMany({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.WORDPRESS,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      disconnectedAt: now,
    },
  });
}

export async function getApplicationPasswordCredentials(websiteId: string): Promise<{
  siteUrl: string;
  username: string;
  applicationPassword: string;
  permissions: WordPressPermissionsExtended;
} | null> {
  const prisma = getPrisma();
  const connection = await prisma.wordPressConnection.findFirst({
    where: {
      websiteId,
      status: WordPressConnectionStatus.CONNECTED,
      disconnectedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      siteUrl: true,
      apiSecretEncrypted: true,
      permissionsJson: true,
    },
  });

  if (!connection?.apiSecretEncrypted) return null;
  const permissions = parseWordPressPermissionsExtended(connection.permissionsJson);
  if (permissions.authMode !== "application_password" || !permissions.username) {
    return null;
  }

  try {
    const applicationPassword = decryptSecret(connection.apiSecretEncrypted);
    return {
      siteUrl: connection.siteUrl,
      username: permissions.username,
      applicationPassword,
      permissions,
    };
  } catch {
    return null;
  }
}

export { assertSafeWordPressUrl };
