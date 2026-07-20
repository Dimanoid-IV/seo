/**
 * Custom publishing webhook config for non-WordPress sites.
 * Persisted on Integration(provider=OTHER) — no schema migration.
 * Endpoint URL encrypted in apiKeyEncrypted; optional HMAC secret in refreshTokenEncrypted.
 * Only host + testedAt are stored in scopesJson (never the full URL).
 */
import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const CUSTOM_PUBLISHING_KIND = "rankboost_custom_publishing" as const;

export type CustomPublishingScopes = {
  kind: typeof CUSTOM_PUBLISHING_KIND;
  endpointHost?: string;
  testedAt?: string | null;
  /** Explicit opt-in for automated send after successful test. Default false. */
  autoSendEnabled?: boolean;
  hasSharedSecret?: boolean;
};

export type CustomPublishingConfig = {
  integrationId: string;
  endpointConfigured: boolean;
  endpointHost: string | null;
  testedAt: string | null;
  autoSendEnabled: boolean;
  hasSharedSecret: boolean;
};

function parseScopes(raw: unknown): CustomPublishingScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== CUSTOM_PUBLISHING_KIND) return null;
  return {
    kind: CUSTOM_PUBLISHING_KIND,
    endpointHost: typeof obj.endpointHost === "string" ? obj.endpointHost : undefined,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
    autoSendEnabled: obj.autoSendEnabled === true,
    hasSharedSecret: obj.hasSharedSecret === true,
  };
}

export async function getCustomPublishingConfig(
  websiteId: string
): Promise<CustomPublishingConfig | null> {
  const prisma = getPrisma();
  const integration = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: {
      id: true,
      apiKeyEncrypted: true,
      refreshTokenEncrypted: true,
      scopesJson: true,
      status: true,
    },
  });

  if (!integration) return null;

  const scopes = parseScopes(integration.scopesJson);
  return {
    integrationId: integration.id,
    endpointConfigured: Boolean(integration.apiKeyEncrypted),
    endpointHost: scopes?.endpointHost ?? null,
    testedAt: scopes?.testedAt ?? null,
    autoSendEnabled: scopes?.autoSendEnabled === true,
    hasSharedSecret: Boolean(
      scopes?.hasSharedSecret || integration.refreshTokenEncrypted
    ),
  };
}

export async function getCustomPublishingWebhookUrl(
  websiteId: string
): Promise<string | null> {
  const prisma = getPrisma();
  const integration = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: { apiKeyEncrypted: true },
  });

  if (!integration?.apiKeyEncrypted) return null;
  try {
    return decryptSecret(integration.apiKeyEncrypted);
  } catch {
    return null;
  }
}

export async function getCustomPublishingSharedSecret(
  websiteId: string
): Promise<string | null> {
  const prisma = getPrisma();
  const integration = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: { refreshTokenEncrypted: true },
  });

  if (!integration?.refreshTokenEncrypted) return null;
  try {
    return decryptSecret(integration.refreshTokenEncrypted);
  } catch {
    return null;
  }
}

export async function upsertCustomPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  endpointUrl: string;
  tested: boolean;
  autoSendEnabled?: boolean;
  sharedSecret?: string | null;
}): Promise<CustomPublishingConfig> {
  const prisma = getPrisma();
  let host: string | null = null;
  try {
    host = new URL(input.endpointUrl).host;
  } catch {
    host = null;
  }

  const hasSecret = Boolean(input.sharedSecret?.trim());
  const scopes: CustomPublishingScopes = {
    kind: CUSTOM_PUBLISHING_KIND,
    endpointHost: host ?? undefined,
    testedAt: input.tested ? new Date().toISOString() : null,
    autoSendEnabled: input.autoSendEnabled === true,
    hasSharedSecret: hasSecret,
  };

  const encrypted = encryptSecret(input.endpointUrl);
  const encryptedSecret = hasSecret
    ? encryptSecret(input.sharedSecret!.trim())
    : null;

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: { id: true, refreshTokenEncrypted: true },
  });

  const data = {
    status: IntegrationStatus.CONNECTED,
    displayName: CUSTOM_PUBLISHING_KIND,
    apiKeyEncrypted: encrypted,
    // Keep existing secret if not provided on this upsert.
    refreshTokenEncrypted:
      encryptedSecret ??
      (input.sharedSecret === null ? null : existing?.refreshTokenEncrypted ?? null),
    scopesJson: {
      ...scopes,
      hasSharedSecret: Boolean(
        encryptedSecret ??
          (input.sharedSecret === null
            ? false
            : existing?.refreshTokenEncrypted)
      ),
    } as unknown as Prisma.InputJsonValue,
    lastSuccessAt: input.tested ? new Date() : undefined,
    disconnectedAt: null,
  };

  const row = existing
    ? await prisma.integration.update({
        where: { id: existing.id },
        data,
        select: {
          id: true,
          scopesJson: true,
          apiKeyEncrypted: true,
          refreshTokenEncrypted: true,
        },
      })
    : await prisma.integration.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          provider: IntegrationProvider.OTHER,
          ...data,
        },
        select: {
          id: true,
          scopesJson: true,
          apiKeyEncrypted: true,
          refreshTokenEncrypted: true,
        },
      });

  const parsed = parseScopes(row.scopesJson);
  return {
    integrationId: row.id,
    endpointConfigured: Boolean(row.apiKeyEncrypted),
    endpointHost: parsed?.endpointHost ?? null,
    testedAt: parsed?.testedAt ?? null,
    autoSendEnabled: parsed?.autoSendEnabled === true,
    hasSharedSecret: Boolean(row.refreshTokenEncrypted),
  };
}

export async function disconnectCustomPublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      refreshTokenEncrypted: null,
      disconnectedAt: new Date(),
      scopesJson: {
        kind: CUSTOM_PUBLISHING_KIND,
        testedAt: null,
        autoSendEnabled: false,
        hasSharedSecret: false,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function setCustomPublishingAutoSend(input: {
  websiteId: string;
  enabled: boolean;
}): Promise<CustomPublishingConfig | null> {
  const prisma = getPrisma();
  const integration = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: { id: true, scopesJson: true },
  });
  if (!integration) return null;

  const scopes = parseScopes(integration.scopesJson);
  if (!scopes) return null;

  const row = await prisma.integration.update({
    where: { id: integration.id },
    data: {
      scopesJson: {
        ...scopes,
        autoSendEnabled: input.enabled,
      } as unknown as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      scopesJson: true,
      apiKeyEncrypted: true,
      refreshTokenEncrypted: true,
    },
  });

  const parsed = parseScopes(row.scopesJson);
  return {
    integrationId: row.id,
    endpointConfigured: Boolean(row.apiKeyEncrypted),
    endpointHost: parsed?.endpointHost ?? null,
    testedAt: parsed?.testedAt ?? null,
    autoSendEnabled: parsed?.autoSendEnabled === true,
    hasSharedSecret: Boolean(row.refreshTokenEncrypted),
  };
}

export function isWebhookReadyForAutoSend(
  config: CustomPublishingConfig | null
): boolean {
  return Boolean(
    config?.endpointConfigured && config.testedAt && config.autoSendEnabled
  );
}
