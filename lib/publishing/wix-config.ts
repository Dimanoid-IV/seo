import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const WIX_PUBLISHING_KIND = "rankboost_wix_blog_publishing" as const;

export type WixScopes = {
  kind: typeof WIX_PUBLISHING_KIND;
  siteId: string;
  testedAt?: string | null;
};

export type WixPublishingConfig = {
  integrationId: string;
  connected: boolean;
  siteId: string;
  testedAt: string | null;
};

export function normalizeWixSiteId(value: string): string {
  return value.trim();
}

export function isSafeWixSiteId(value: string): boolean {
  return /^[A-Za-z0-9_-]{8,128}$/.test(normalizeWixSiteId(value));
}

export function parseWixScopes(raw: unknown): WixScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== WIX_PUBLISHING_KIND) return null;
  const siteId =
    typeof obj.siteId === "string" ? normalizeWixSiteId(obj.siteId) : "";
  if (!isSafeWixSiteId(siteId)) return null;
  return {
    kind: WIX_PUBLISHING_KIND,
    siteId,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): WixPublishingConfig | null {
  const scopes = parseWixScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    siteId: scopes.siteId,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getWixPublishingConfig(
  websiteId: string
): Promise<WixPublishingConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.WIX,
      displayName: WIX_PUBLISHING_KIND,
    },
    select: {
      id: true,
      status: true,
      apiKeyEncrypted: true,
      scopesJson: true,
    },
  });
  return row ? toConfig(row) : null;
}

export async function getWixApiKey(websiteId: string): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.WIX,
      displayName: WIX_PUBLISHING_KIND,
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

export async function upsertWixPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  siteId: string;
  apiKey: string;
  tested: boolean;
}): Promise<WixPublishingConfig> {
  const prisma = getPrisma();
  const scopes: WixScopes = {
    kind: WIX_PUBLISHING_KIND,
    siteId: normalizeWixSiteId(input.siteId),
    testedAt: input.tested ? new Date().toISOString() : null,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.WIX,
      displayName: WIX_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: WIX_PUBLISHING_KIND,
    apiKeyEncrypted: encryptSecret(input.apiKey.trim()),
    scopesJson: scopes as unknown as Prisma.InputJsonValue,
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
          scopesJson: true,
        },
      })
    : await prisma.integration.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          provider: IntegrationProvider.WIX,
          ...data,
        },
        select: {
          id: true,
          status: true,
          apiKeyEncrypted: true,
          scopesJson: true,
        },
      });

  const config = toConfig(row);
  if (!config) throw new Error("Could not save Wix configuration.");
  return config;
}

export async function disconnectWixPublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.WIX,
      displayName: WIX_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      disconnectedAt: new Date(),
    },
  });
}
