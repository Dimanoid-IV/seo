/**
 * GitHub PR publishing configuration.
 * Stored on Integration(provider=GITHUB): token encrypted in apiKeyEncrypted;
 * scopesJson contains only non-secret repo/path settings.
 */
import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

export const GITHUB_PR_KIND = "rankboost_github_pr" as const;

export type GitHubPrScopes = {
  kind: typeof GITHUB_PR_KIND;
  owner: string;
  repo: string;
  baseBranch: string;
  contentPath: string;
  testedAt?: string | null;
};

export type GitHubPrConfig = {
  integrationId: string;
  connected: boolean;
  owner: string;
  repo: string;
  baseBranch: string;
  contentPath: string;
  testedAt: string | null;
};

function normalizePath(value: string): string {
  return value
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.\./g, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
}

export function parseGitHubPrScopes(raw: unknown): GitHubPrScopes | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (obj.kind !== GITHUB_PR_KIND) return null;
  const owner = typeof obj.owner === "string" ? obj.owner.trim() : "";
  const repo = typeof obj.repo === "string" ? obj.repo.trim() : "";
  const baseBranch =
    typeof obj.baseBranch === "string" && obj.baseBranch.trim()
      ? obj.baseBranch.trim()
      : "main";
  const contentPath =
    typeof obj.contentPath === "string" && obj.contentPath.trim()
      ? normalizePath(obj.contentPath)
      : "content/blog";
  if (!owner || !repo) return null;
  return {
    kind: GITHUB_PR_KIND,
    owner,
    repo,
    baseBranch,
    contentPath,
    testedAt: typeof obj.testedAt === "string" ? obj.testedAt : null,
  };
}

function toConfig(row: {
  id: string;
  status: IntegrationStatus;
  apiKeyEncrypted: string | null;
  scopesJson: Prisma.JsonValue | null;
}): GitHubPrConfig | null {
  const scopes = parseGitHubPrScopes(row.scopesJson);
  if (!scopes) return null;
  return {
    integrationId: row.id,
    connected:
      row.status === IntegrationStatus.CONNECTED && Boolean(row.apiKeyEncrypted),
    owner: scopes.owner,
    repo: scopes.repo,
    baseBranch: scopes.baseBranch,
    contentPath: scopes.contentPath,
    testedAt: scopes.testedAt ?? null,
  };
}

export async function getGitHubPrConfig(
  websiteId: string
): Promise<GitHubPrConfig | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.GITHUB,
      displayName: GITHUB_PR_KIND,
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

export async function getGitHubPrToken(
  websiteId: string
): Promise<string | null> {
  const prisma = getPrisma();
  const row = await prisma.integration.findFirst({
    where: {
      websiteId,
      provider: IntegrationProvider.GITHUB,
      displayName: GITHUB_PR_KIND,
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

export async function upsertGitHubPrConfig(input: {
  websiteId: string;
  organizationId: string;
  owner: string;
  repo: string;
  baseBranch?: string | null;
  contentPath?: string | null;
  token: string;
  tested: boolean;
}): Promise<GitHubPrConfig> {
  const prisma = getPrisma();
  const owner = input.owner.trim();
  const repo = input.repo.trim();
  const baseBranch = input.baseBranch?.trim() || "main";
  const contentPath = normalizePath(input.contentPath || "content/blog");
  const testedAt = input.tested ? new Date().toISOString() : null;

  const scopes: GitHubPrScopes = {
    kind: GITHUB_PR_KIND,
    owner,
    repo,
    baseBranch,
    contentPath,
    testedAt,
  };

  const existing = await prisma.integration.findFirst({
    where: {
      websiteId: input.websiteId,
      provider: IntegrationProvider.GITHUB,
      displayName: GITHUB_PR_KIND,
    },
    select: { id: true },
  });

  const data = {
    status: input.tested
      ? IntegrationStatus.CONNECTED
      : IntegrationStatus.CONNECTING,
    displayName: GITHUB_PR_KIND,
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
          provider: IntegrationProvider.GITHUB,
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
  if (!config) {
    throw new Error("Could not save GitHub PR configuration.");
  }
  return config;
}

export async function disconnectGitHubPrConfig(
  websiteId: string
): Promise<void> {
  const prisma = getPrisma();
  await prisma.integration.updateMany({
    where: {
      websiteId,
      provider: IntegrationProvider.GITHUB,
      displayName: GITHUB_PR_KIND,
    },
    data: {
      status: IntegrationStatus.DISCONNECTED,
      apiKeyEncrypted: null,
      disconnectedAt: new Date(),
    },
  });
}
