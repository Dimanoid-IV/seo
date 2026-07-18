/**
 * Custom publishing webhook config for non-WordPress sites.
 * Persisted on Integration(provider=OTHER) — no schema migration.
 * Endpoint URL is encrypted; only host + testedAt are stored in scopesJson.
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
};

export type CustomPublishingConfig = {
  integrationId: string;
  endpointConfigured: boolean;
  endpointHost: string | null;
  testedAt: string | null;
  autoSendEnabled: boolean;
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

export async function upsertCustomPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  endpointUrl: string;
  tested: boolean;
  autoSendEnabled?: boolean;
}): Promise<CustomPublishingConfig> {
  const prisma = getPrisma();
  let host: string | null = null;
  try {
    host = new URL(input.endpointUrl).host;
  } catch {
    host = null;
  }

  const scopes: CustomPublishingScopes = {
    kind: CUSTOM_PUBLISHING_KIND,
    endpointHost: host ?? undefined,
    testedAt: input.tested ? new Date().toISOString() : null,
    autoSendEnabled: input.autoSendEnabled === true,
  };

  const encrypted = encryptSecret(input.endpointUrl);

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.OTHER,
      displayName: CUSTOM_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: IntegrationStatus.CONNECTED,
    displayName: CUSTOM_PUBLISHING_KIND,
    apiKeyEncrypted: encrypted,
    scopesJson: scopes as unknown as Prisma.InputJsonValue,
    lastSuccessAt: input.tested ? new Date() : undefined,
  };

  const row = existing
    ? await prisma.integration.update({
        where: { id: existing.id },
        data,
        select: { id: true, scopesJson: true, apiKeyEncrypted: true },
      })
    : await prisma.integration.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          provider: IntegrationProvider.OTHER,
          ...data,
        },
        select: { id: true, scopesJson: true, apiKeyEncrypted: true },
      });

  const parsed = parseScopes(row.scopesJson);
  return {
    integrationId: row.id,
    endpointConfigured: Boolean(row.apiKeyEncrypted),
    endpointHost: parsed?.endpointHost ?? null,
    testedAt: parsed?.testedAt ?? null,
    autoSendEnabled: parsed?.autoSendEnabled === true,
  };
}

export function isWebhookReadyForAutoSend(
  config: CustomPublishingConfig | null
): boolean {
  return Boolean(
    config?.endpointConfigured && config.testedAt && config.autoSendEnabled
  );
}
