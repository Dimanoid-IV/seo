import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const NO_CODE_AUTOMATION_KIND = "rankboost_no_code_automation" as const;

export type NoCodeAutomationProvider = "zapier" | "make";

const PROVIDER_TO_DB = {
  zapier: IntegrationProvider.ZAPIER,
  make: IntegrationProvider.MAKE,
} as const satisfies Record<NoCodeAutomationProvider, IntegrationProvider>;

export type NoCodeAutomationScopes = {
  kind: typeof NO_CODE_AUTOMATION_KIND;
  provider: NoCodeAutomationProvider;
  endpointHost?: string | null;
  testedAt?: string | null;
  hasSharedSecret?: boolean;
};

export type NoCodeAutomationConfig = {
  integrationId: string;
  provider: NoCodeAutomationProvider;
  connected: boolean;
  endpointConfigured: boolean;
  endpointHost: string | null;
  testedAt: string | null;
  hasSharedSecret: boolean;
};

export function toDbProvider(provider: NoCodeAutomationProvider): IntegrationProvider {
  return PROVIDER_TO_DB[provider];
}

export function parseNoCodeAutomationProvider(
  value: string
): NoCodeAutomationProvider | null {
  return value === "zapier" || value === "make" ? value : null;
}

function parseScopes(raw: unknown): NoCodeAutomationScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== NO_CODE_AUTOMATION_KIND) return null;
  const provider =
    typeof obj.provider === "string"
      ? parseNoCodeAutomationProvider(obj.provider)
      : null;
  if (!provider) return null;
  return {
    kind: NO_CODE_AUTOMATION_KIND,
    provider,
    endpointHost:
      typeof obj.endpointHost === "string" ? obj.endpointHost : null,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
    hasSharedSecret: obj.hasSharedSecret === true,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): NoCodeAutomationConfig | null {
  const scopes = parseScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    provider: scopes.provider,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    endpointConfigured: Boolean(row.apiKeyEncrypted),
    endpointHost: scopes.endpointHost ?? null,
    testedAt: scopes.testedAt ?? null,
    hasSharedSecret: Boolean(scopes.hasSharedSecret || row.refreshTokenEncrypted),
  };
}

export async function getNoCodeAutomationConfig(input: {
  websiteId: string;
  provider: NoCodeAutomationProvider;
}): Promise<NoCodeAutomationConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: toDbProvider(input.provider),
      displayName: NO_CODE_AUTOMATION_KIND,
    },
    select: {
      id: true,
      status: true,
      apiKeyEncrypted: true,
      refreshTokenEncrypted: true,
      scopesJson: true,
    },
  });
  return row ? toConfig(row) : null;
}

export async function getNoCodeAutomationWebhookUrl(input: {
  websiteId: string;
  provider: NoCodeAutomationProvider;
}): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: toDbProvider(input.provider),
      displayName: NO_CODE_AUTOMATION_KIND,
    },
    select: { apiKeyEncrypted: true },
  });
  if (!row?.apiKeyEncrypted) return null;
  try {
    return decryptSecret(row.apiKeyEncrypted);
  } catch {
    return null;
  }
}

export async function getNoCodeAutomationSharedSecret(input: {
  websiteId: string;
  provider: NoCodeAutomationProvider;
}): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: toDbProvider(input.provider),
      displayName: NO_CODE_AUTOMATION_KIND,
    },
    select: { refreshTokenEncrypted: true },
  });
  if (!row?.refreshTokenEncrypted) return null;
  try {
    return decryptSecret(row.refreshTokenEncrypted);
  } catch {
    return null;
  }
}

export async function upsertNoCodeAutomationConfig(input: {
  websiteId: string;
  organizationId: string;
  provider: NoCodeAutomationProvider;
  endpointUrl: string;
  tested: boolean;
  sharedSecret?: string | null;
}): Promise<NoCodeAutomationConfig> {
  const prisma = getPrisma();
  const endpointHost = new URL(input.endpointUrl).host;
  const hasSecret = Boolean(input.sharedSecret?.trim());
  const scopes: NoCodeAutomationScopes = {
    kind: NO_CODE_AUTOMATION_KIND,
    provider: input.provider,
    endpointHost,
    testedAt: input.tested ? new Date().toISOString() : null,
    hasSharedSecret: hasSecret,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: toDbProvider(input.provider),
      displayName: NO_CODE_AUTOMATION_KIND,
    },
    select: { id: true, refreshTokenEncrypted: true },
  });

  const encryptedSecret = hasSecret
    ? encryptSecret(input.sharedSecret!.trim())
    : null;
  const data = {
    status: IntegrationStatus.CONNECTED,
    displayName: NO_CODE_AUTOMATION_KIND,
    apiKeyEncrypted: encryptSecret(input.endpointUrl),
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
          status: true,
          apiKeyEncrypted: true,
          refreshTokenEncrypted: true,
          scopesJson: true,
        },
      })
    : await prisma.integration.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          provider: toDbProvider(input.provider),
          ...data,
        },
        select: {
          id: true,
          status: true,
          apiKeyEncrypted: true,
          refreshTokenEncrypted: true,
          scopesJson: true,
        },
      });

  const config = toConfig(row);
  if (!config) throw new Error("Could not save automation config.");
  return config;
}

export async function disconnectNoCodeAutomationConfig(input: {
  websiteId: string;
  provider: NoCodeAutomationProvider;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId: input.websiteId,
      provider: toDbProvider(input.provider),
      displayName: NO_CODE_AUTOMATION_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      refreshTokenEncrypted: null,
      disconnectedAt: new Date(),
      scopesJson: {
        kind: NO_CODE_AUTOMATION_KIND,
        provider: input.provider,
        testedAt: null,
        hasSharedSecret: false,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}
