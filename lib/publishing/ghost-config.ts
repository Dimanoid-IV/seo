import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const GHOST_PUBLISHING_KIND = "rankboost_ghost_publishing" as const;

export type GhostScopes = {
  kind: typeof GHOST_PUBLISHING_KIND;
  adminUrl: string;
  authorSlug?: string | null;
  testedAt?: string | null;
};

export type GhostPublishingConfig = {
  integrationId: string;
  connected: boolean;
  adminUrl: string;
  authorSlug: string | null;
  testedAt: string | null;
};

export function normalizeGhostAdminUrl(value: string): string {
  const raw = value.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function parseGhostAdminKey(value: string): { id: string; secret: string } | null {
  const [id, secret, ...rest] = value.trim().split(":");
  if (rest.length > 0 || !id || !secret) return null;
  if (!/^[a-f0-9]{24}$/i.test(id)) return null;
  if (!/^[a-f0-9]{64}$/i.test(secret)) return null;
  return { id, secret };
}

export function parseGhostScopes(raw: unknown): GhostScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== GHOST_PUBLISHING_KIND) return null;
  const adminUrl =
    typeof obj.adminUrl === "string" ? normalizeGhostAdminUrl(obj.adminUrl) : "";
  if (!adminUrl) return null;
  return {
    kind: GHOST_PUBLISHING_KIND,
    adminUrl,
    authorSlug:
      typeof obj.authorSlug === "string" && obj.authorSlug.trim()
        ? obj.authorSlug.trim()
        : null,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): GhostPublishingConfig | null {
  const scopes = parseGhostScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    adminUrl: scopes.adminUrl,
    authorSlug: scopes.authorSlug ?? null,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getGhostPublishingConfig(
  websiteId: string
): Promise<GhostPublishingConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.GHOST,
      displayName: GHOST_PUBLISHING_KIND,
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

export async function getGhostAdminKey(websiteId: string): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.GHOST,
      displayName: GHOST_PUBLISHING_KIND,
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

export async function upsertGhostPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  adminUrl: string;
  adminKey: string;
  authorSlug?: string | null;
  tested: boolean;
}): Promise<GhostPublishingConfig> {
  const prisma = getPrisma();
  const scopes: GhostScopes = {
    kind: GHOST_PUBLISHING_KIND,
    adminUrl: normalizeGhostAdminUrl(input.adminUrl),
    authorSlug: input.authorSlug?.trim() || null,
    testedAt: input.tested ? new Date().toISOString() : null,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.GHOST,
      displayName: GHOST_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: GHOST_PUBLISHING_KIND,
    apiKeyEncrypted: encryptSecret(input.adminKey.trim()),
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
          provider: IntegrationProvider.GHOST,
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
  if (!config) throw new Error("Could not save Ghost configuration.");
  return config;
}

export async function disconnectGhostPublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.GHOST,
      displayName: GHOST_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      disconnectedAt: new Date(),
    },
  });
}
