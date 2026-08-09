import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";

export const SQUARESPACE_PUBLISHING_KIND =
  "rankboost_squarespace_guided_publishing" as const;

export type SquarespaceScopes = {
  kind: typeof SQUARESPACE_PUBLISHING_KIND;
  siteUrl: string;
  blogUrl?: string | null;
  testedAt?: string | null;
};

export type SquarespacePublishingConfig = {
  integrationId: string;
  connected: boolean;
  siteUrl: string;
  blogUrl: string | null;
  testedAt: string | null;
};

export function normalizeSquarespaceUrl(value: string): string {
  const raw = value.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withScheme);
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export function parseSquarespaceScopes(raw: unknown): SquarespaceScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== SQUARESPACE_PUBLISHING_KIND) return null;
  const siteUrl =
    typeof obj.siteUrl === "string" ? normalizeSquarespaceUrl(obj.siteUrl) : "";
  if (!siteUrl) return null;
  return {
    kind: SQUARESPACE_PUBLISHING_KIND,
    siteUrl,
    blogUrl:
      typeof obj.blogUrl === "string" && obj.blogUrl.trim()
        ? normalizeSquarespaceUrl(obj.blogUrl)
        : null,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  scopesJson: Prisma.JsonValue | null;
}): SquarespacePublishingConfig | null {
  const scopes = parseSquarespaceScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected: row.status === IntegrationStatus.CONNECTED,
    siteUrl: scopes.siteUrl,
    blogUrl: scopes.blogUrl ?? null,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getSquarespacePublishingConfig(
  websiteId: string
): Promise<SquarespacePublishingConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.SQUARESPACE,
      displayName: SQUARESPACE_PUBLISHING_KIND,
    },
    select: {
      id: true,
      status: true,
      scopesJson: true,
    },
  });
  return row ? toConfig(row) : null;
}

export async function upsertSquarespacePublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  siteUrl: string;
  blogUrl?: string | null;
  tested: boolean;
}): Promise<SquarespacePublishingConfig> {
  const prisma = getPrisma();
  const scopes: SquarespaceScopes = {
    kind: SQUARESPACE_PUBLISHING_KIND,
    siteUrl: normalizeSquarespaceUrl(input.siteUrl),
    blogUrl: input.blogUrl?.trim()
      ? normalizeSquarespaceUrl(input.blogUrl)
      : null,
    testedAt: input.tested ? new Date().toISOString() : null,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.SQUARESPACE,
      displayName: SQUARESPACE_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: SQUARESPACE_PUBLISHING_KIND,
    scopesJson: scopes as unknown as Prisma.InputJsonValue,
    lastSuccessAt: input.tested ? new Date() : undefined,
    disconnectedAt: null,
  };

  const row = existing
    ? await prisma.integration.update({
        where: { id: existing.id },
        data,
        select: { id: true, status: true, scopesJson: true },
      })
    : await prisma.integration.create({
        data: {
          websiteId: input.websiteId,
          organizationId: input.organizationId,
          provider: IntegrationProvider.SQUARESPACE,
          ...data,
        },
        select: { id: true, status: true, scopesJson: true },
      });

  const config = toConfig(row);
  if (!config) throw new Error("Could not save Squarespace configuration.");
  return config;
}

export async function disconnectSquarespacePublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.SQUARESPACE,
      displayName: SQUARESPACE_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      disconnectedAt: new Date(),
    },
  });
}
