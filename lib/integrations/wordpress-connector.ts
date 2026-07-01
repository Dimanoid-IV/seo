import {
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
  WordPressConnectionStatus,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { generateToken, hashSecret } from "@/lib/security";

import type { WordPressPermissions } from "./wordpress-types";

export const DEFAULT_WORDPRESS_PERMISSIONS = {
  canCreateDrafts: true,
  canUpdateMeta: false,
  canPublish: false,
} as const;

export type { WordPressPermissions } from "./wordpress-types";

export type WordPressConnectionRecord = {
  id: string;
  websiteId: string;
  organizationId: string;
  status: WordPressConnectionStatus;
  siteUrl: string;
  pluginVersion: string | null;
  permissions: WordPressPermissions;
  lastPingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    parsed.hash = "";
    parsed.search = "";
    let normalized = parsed.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return trimmed.replace(/\/$/, "");
  }
}

function parsePermissionsJson(value: unknown): WordPressPermissions {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_WORDPRESS_PERMISSIONS };
  }

  const record = value as Record<string, unknown>;
  return {
    canCreateDrafts:
      typeof record.canCreateDrafts === "boolean"
        ? record.canCreateDrafts
        : DEFAULT_WORDPRESS_PERMISSIONS.canCreateDrafts,
    canUpdateMeta:
      typeof record.canUpdateMeta === "boolean"
        ? record.canUpdateMeta
        : DEFAULT_WORDPRESS_PERMISSIONS.canUpdateMeta,
    canPublish:
      typeof record.canPublish === "boolean"
        ? record.canPublish
        : DEFAULT_WORDPRESS_PERMISSIONS.canPublish,
  };
}

function serializeConnection(connection: {
  id: string;
  websiteId: string;
  organizationId: string;
  status: WordPressConnectionStatus;
  siteUrl: string;
  pluginVersion: string | null;
  permissionsJson: unknown;
  lastPingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): WordPressConnectionRecord {
  return {
    id: connection.id,
    websiteId: connection.websiteId,
    organizationId: connection.organizationId,
    status: connection.status,
    siteUrl: connection.siteUrl,
    pluginVersion: connection.pluginVersion,
    permissions: parsePermissionsJson(connection.permissionsJson),
    lastPingAt: connection.lastPingAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

export function mapWordPressConnectionStatus(status: WordPressConnectionStatus): {
  connected: boolean;
  label: string;
} {
  if (status === WordPressConnectionStatus.CONNECTED) {
    return { connected: true, label: "Connected" };
  }
  if (status === WordPressConnectionStatus.PENDING) {
    return { connected: false, label: "Pending" };
  }
  if (status === WordPressConnectionStatus.ERROR) {
    return { connected: false, label: "Error" };
  }
  return { connected: false, label: "Disconnected" };
}

/**
 * Creates a new WordPress connection with one-time plaintext API key and shared secret.
 */
export async function createWordPressConnection({
  websiteId,
  organizationId,
  siteUrl,
}: {
  websiteId: string;
  organizationId: string;
  siteUrl: string;
}): Promise<{
  connection: WordPressConnectionRecord;
  apiKey: string;
  apiSecret: string;
}> {
  const prisma = getPrisma();
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);

  if (!normalizedSiteUrl) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите URL сайта WordPress");
  }

  const apiKey = generateToken("wp");
  const apiSecret = generateToken("wpsec");
  const apiKeyHash = hashSecret(apiKey);
  const apiSecretEncrypted = encryptSecret(apiSecret);

  const connection = await prisma.wordPressConnection.create({
    data: {
      websiteId,
      organizationId,
      siteUrl: normalizedSiteUrl,
      status: WordPressConnectionStatus.PENDING,
      apiKeyHash,
      apiSecretEncrypted,
      permissionsJson: DEFAULT_WORDPRESS_PERMISSIONS,
    },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      status: true,
      siteUrl: true,
      pluginVersion: true,
      permissionsJson: true,
      lastPingAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    connection: serializeConnection(connection),
    apiKey,
    apiSecret,
  };
}

/**
 * Returns WordPress connection with decrypted shared secret for server-to-WP calls.
 */
export async function getWordPressConnectionWithSecret({
  websiteId,
}: {
  websiteId: string;
}): Promise<{ connection: WordPressConnectionRecord; apiSecret: string }> {
  const prisma = getPrisma();

  const connection = await prisma.wordPressConnection.findFirst({
    where: {
      websiteId,
      disconnectedAt: null,
      status: WordPressConnectionStatus.CONNECTED,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      status: true,
      siteUrl: true,
      pluginVersion: true,
      permissionsJson: true,
      lastPingAt: true,
      createdAt: true,
      updatedAt: true,
      apiSecretEncrypted: true,
    },
  });

  if (!connection) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "WordPress не подключён. Завершите настройку плагина и проверьте соединение."
    );
  }

  if (!connection.apiSecretEncrypted) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "Для создания черновиков нужен Shared Secret. Создайте новое подключение WordPress в Integrations."
    );
  }

  const apiSecret = decryptSecret(connection.apiSecretEncrypted);

  return {
    connection: serializeConnection(connection),
    apiSecret,
  };
}

/**
 * Returns the active WordPress connection for a website, if any.
 */
export async function getWordPressConnection({
  websiteId,
}: {
  websiteId: string;
}): Promise<WordPressConnectionRecord | null> {
  const prisma = getPrisma();

  const connection = await prisma.wordPressConnection.findFirst({
    where: {
      websiteId,
      disconnectedAt: null,
      status: {
        in: [
          WordPressConnectionStatus.PENDING,
          WordPressConnectionStatus.CONNECTED,
          WordPressConnectionStatus.ERROR,
        ],
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      status: true,
      siteUrl: true,
      pluginVersion: true,
      permissionsJson: true,
      lastPingAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return connection ? serializeConnection(connection) : null;
}

/**
 * Verifies a WordPress plugin API key and returns the connection.
 */
export async function verifyWordPressApiKey({
  apiKey,
}: {
  apiKey: string;
}): Promise<WordPressConnectionRecord> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Недействительный API key");
  }

  const prisma = getPrisma();
  const apiKeyHash = hashSecret(trimmed);

  const connection = await prisma.wordPressConnection.findFirst({
    where: {
      apiKeyHash,
      disconnectedAt: null,
      status: {
        not: WordPressConnectionStatus.DISCONNECTED,
      },
    },
    select: {
      id: true,
      websiteId: true,
      organizationId: true,
      status: true,
      siteUrl: true,
      pluginVersion: true,
      permissionsJson: true,
      lastPingAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!connection) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Недействительный API key");
  }

  return serializeConnection(connection);
}

/**
 * Handles plugin ping — marks connection as CONNECTED and syncs Integration row.
 */
export async function handleWordPressPing({
  apiKey,
  siteUrl,
  pluginVersion,
}: {
  apiKey: string;
  siteUrl: string;
  pluginVersion: string;
}) {
  const connection = await verifyWordPressApiKey({ apiKey });
  const prisma = getPrisma();
  const now = new Date();
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const permissions = parsePermissionsJson(
    (
      await prisma.wordPressConnection.findUnique({
        where: { id: connection.id },
        select: { permissionsJson: true },
      })
    )?.permissionsJson
  );

  await prisma.$transaction(async (tx) => {
    await tx.wordPressConnection.update({
      where: { id: connection.id },
      data: {
        status: WordPressConnectionStatus.CONNECTED,
        pluginVersion: pluginVersion.trim() || null,
        lastPingAt: now,
        ...(normalizedSiteUrl ? { siteUrl: normalizedSiteUrl } : {}),
      },
    });

    await tx.integration.upsert({
      where: {
        websiteId_provider: {
          websiteId: connection.websiteId,
          provider: IntegrationProvider.WORDPRESS,
        },
      },
      create: {
        websiteId: connection.websiteId,
        organizationId: connection.organizationId,
        provider: IntegrationProvider.WORDPRESS,
        status: IntegrationStatus.CONNECTED,
        displayName: "WordPress",
        scopesJson: permissions,
        lastSyncAt: now,
        lastSuccessAt: now,
      },
      update: {
        status: IntegrationStatus.CONNECTED,
        scopesJson: permissions,
        lastSyncAt: now,
        lastSuccessAt: now,
        lastErrorAt: null,
        lastErrorMessage: null,
        disconnectedAt: null,
      },
    });
  });

  return {
    success: true as const,
    permissions,
  };
}

/**
 * Resolves website for WordPress connector operations.
 */
export async function resolveWebsiteForWordPress(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null,
  siteUrl?: string | null
) {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: {
          id: organizationId,
          deletedAt: null,
          ownerUserId: userId,
        },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

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
        select: { id: true, url: true, organizationId: true },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true, organizationId: true },
      });

  if (!website) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "Добавьте сайт, чтобы подключить WordPress"
    );
  }

  const resolvedSiteUrl = normalizeSiteUrl(siteUrl?.trim() || website.url);

  return {
    website,
    organizationId: organization.id,
    siteUrl: resolvedSiteUrl,
  };
}

export { normalizeSiteUrl, parsePermissionsJson };
