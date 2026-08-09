import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const SHOPIFY_PUBLISHING_KIND = "rankboost_shopify_blog_publishing" as const;

export type ShopifyScopes = {
  kind: typeof SHOPIFY_PUBLISHING_KIND;
  shopDomain: string;
  blogId: string;
  authorName?: string | null;
  testedAt?: string | null;
};

export type ShopifyPublishingConfig = {
  integrationId: string;
  connected: boolean;
  shopDomain: string;
  blogId: string;
  authorName: string | null;
  testedAt: string | null;
};

export function normalizeShopifyDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function isSafeShopifyDomain(value: string): boolean {
  const domain = normalizeShopifyDomain(value);
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain);
}

export function parseShopifyScopes(raw: unknown): ShopifyScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== SHOPIFY_PUBLISHING_KIND) return null;
  const shopDomain =
    typeof obj.shopDomain === "string" ? normalizeShopifyDomain(obj.shopDomain) : "";
  const blogId = typeof obj.blogId === "string" ? obj.blogId.trim() : "";
  if (!isSafeShopifyDomain(shopDomain) || !blogId) return null;
  return {
    kind: SHOPIFY_PUBLISHING_KIND,
    shopDomain,
    blogId,
    authorName:
      typeof obj.authorName === "string" && obj.authorName.trim()
        ? obj.authorName.trim()
        : null,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): ShopifyPublishingConfig | null {
  const scopes = parseShopifyScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    shopDomain: scopes.shopDomain,
    blogId: scopes.blogId,
    authorName: scopes.authorName ?? null,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getShopifyPublishingConfig(
  websiteId: string
): Promise<ShopifyPublishingConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.SHOPIFY,
      displayName: SHOPIFY_PUBLISHING_KIND,
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

export async function getShopifyToken(websiteId: string): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.SHOPIFY,
      displayName: SHOPIFY_PUBLISHING_KIND,
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

export async function upsertShopifyPublishingConfig(input: {
  websiteId: string;
  organizationId: string;
  shopDomain: string;
  blogId: string;
  token: string;
  authorName?: string | null;
  tested: boolean;
}): Promise<ShopifyPublishingConfig> {
  const prisma = getPrisma();
  const shopDomain = normalizeShopifyDomain(input.shopDomain);
  const scopes: ShopifyScopes = {
    kind: SHOPIFY_PUBLISHING_KIND,
    shopDomain,
    blogId: input.blogId.trim(),
    authorName: input.authorName?.trim() || null,
    testedAt: input.tested ? new Date().toISOString() : null,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.SHOPIFY,
      displayName: SHOPIFY_PUBLISHING_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: SHOPIFY_PUBLISHING_KIND,
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
          provider: IntegrationProvider.SHOPIFY,
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
  if (!config) throw new Error("Could not save Shopify configuration.");
  return config;
}

export async function disconnectShopifyPublishingConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.SHOPIFY,
      displayName: SHOPIFY_PUBLISHING_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      disconnectedAt: new Date(),
    },
  });
}
