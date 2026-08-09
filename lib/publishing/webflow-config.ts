import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const WEBFLOW_PUBLISHING_KIND = "rankboost_webflow_publishing" as const;

export type WebflowFieldMapping = {
  name: string;
  slug: string;
  body: string;
  summary?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
};

export type WebflowScopes = {
  kind: typeof WEBFLOW_PUBLISHING_KIND;
  siteId: string;
  collectionId: string;
  fieldMapping: WebflowFieldMapping;
  testedAt?: string | null;
};

export type WebflowPublishingConfig = {
  integrationId: string;
  connected: boolean;
  siteId: string;
  collectionId: string;
  fieldMapping: WebflowFieldMapping;
  testedAt: string | null;
};

const DEFAULT_MAPPING: WebflowFieldMapping = {
  name: "name",
  slug: "slug",
  body: "post-body",
  summary: "post-summary",
  metaTitle: "meta-title",
  metaDescription: "meta-description",
};

function normalizeField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function normalizeWebflowFieldMapping(
  raw?: Partial<WebflowFieldMapping> | null
): WebflowFieldMapping {
  return {
    name: normalizeField(raw?.name, DEFAULT_MAPPING.name),
    slug: normalizeField(raw?.slug, DEFAULT_MAPPING.slug),
    body: normalizeField(raw?.body, DEFAULT_MAPPING.body),
    summary:
      typeof raw?.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : DEFAULT_MAPPING.summary,
    metaTitle:
      typeof raw?.metaTitle === "string" && raw.metaTitle.trim()
        ? raw.metaTitle.trim()
        : DEFAULT_MAPPING.metaTitle,
    metaDescription:
      typeof raw?.metaDescription === "string" && raw.metaDescription.trim()
        ? raw.metaDescription.trim()
        : DEFAULT_MAPPING.metaDescription,
  };
}

export function parseWebflowScopes(raw: unknown): WebflowScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== WEBFLOW_PUBLISHING_KIND) return null;
  const siteId = typeof obj.siteId === "string" ? obj.siteId.trim() : "";
  const collectionId =
    typeof obj.collectionId === "string" ? obj.collectionId.trim() : "";
  if (!siteId || !collectionId) return null;
  const fieldMappingRaw =
    obj.fieldMapping && typeof obj.fieldMapping === "object"
      ? (obj.fieldMapping as Partial<WebflowFieldMapping>)
      : null;
  return {
    kind: WEBFLOW_PUBLISHING_KIND,
    siteId,
    collectionId,
    fieldMapping: normalizeWebflowFieldMapping(fieldMappingRaw),
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): WebflowPublishingConfig | null {
  const scopes = parseWebflowScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    siteId: scopes.siteId,
    collectionId: scopes.collectionId,
    fieldMapping: scopes.fieldMapping,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getWebflowPublishingConfig(
  websiteId: string
): Promise<WebflowPublishingConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.WEBFLOW,
      displayName: WEBFLOW_PUBLISHING_KIND,
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

export async function getWebflowToken(websiteId: string): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.WEBFLOW,
      displayName: WEBFLOW_PUBLISHING_KIND,
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

export async function upsertWebflowPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  siteId: string;
  collectionId: string;
  token: string;
  fieldMapping?: Partial<WebflowFieldMapping> | null;
  tested: boolean;
}): Promise<WebflowPublishingConfig> {
  const prisma = getPrisma();
  const scopes: WebflowScopes = {
    kind: WEBFLOW_PUBLISHING_KIND,
    siteId: input.siteId.trim(),
    collectionId: input.collectionId.trim(),
    fieldMapping: normalizeWebflowFieldMapping(input.fieldMapping),
    testedAt: input.tested ? new Date().toISOString() : null,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.WEBFLOW,
      displayName: WEBFLOW_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: WEBFLOW_PUBLISHING_KIND,
    apiKeyEncrypted: encryptSecret(input.token.trim()),
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
          provider: IntegrationProvider.WEBFLOW,
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
  if (!config) throw new Error("Could not save Webflow configuration.");
  return config;
}

export async function disconnectWebflowPublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.WEBFLOW,
      displayName: WEBFLOW_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      disconnectedAt: new Date(),
    },
  });
}
