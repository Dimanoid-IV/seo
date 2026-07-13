import "server-only";

import { getServerEnv } from "@/lib/env";
import { assertServerOnly } from "@/lib/security";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 0;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFlag(value: string | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export type HermesEnvConfig = {
  apiUrl: string | null;
  apiSecret: string | null;
  model: string | null;
  timeoutMs: number;
  maxRetries: number;
  testMode: boolean;
  stubEnabled: boolean;
};

/** Reads Hermes env configuration without throwing. */
export function getHermesEnvConfig(): HermesEnvConfig {
  assertServerOnly();
  const env = getServerEnv();
  const apiUrl = env.HERMES_API_URL?.trim().replace(/\/$/, "") ?? null;
  const apiSecret = env.HERMES_API_SECRET?.trim() ?? null;

  return {
    apiUrl: apiUrl || null,
    apiSecret: apiSecret || null,
    model: env.HERMES_MODEL?.trim() ?? null,
    timeoutMs: parsePositiveInt(env.HERMES_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxRetries: parsePositiveInt(env.HERMES_MAX_RETRIES, DEFAULT_MAX_RETRIES),
    testMode: parseFlag(env.HERMES_TEST_MODE),
    stubEnabled: parseFlag(env.HERMES_STUB_ENABLED),
  };
}

/** True when both HERMES_API_URL and HERMES_API_SECRET are set. */
export function isHermesConfigured(): boolean {
  const { apiUrl, apiSecret } = getHermesEnvConfig();
  return Boolean(apiUrl && apiSecret);
}

export type HermesAvailability = {
  generationConfigured: boolean;
  hasApiUrl: boolean;
  hasApiSecret: boolean;
  hasApiKey: boolean;
};

/** Presence-only Hermes env flags shared by health checks and generation gates. */
export function getHermesAvailability(): HermesAvailability {
  assertServerOnly();
  const { apiUrl, apiSecret } = getHermesEnvConfig();

  return {
    generationConfigured: Boolean(apiUrl && apiSecret),
    hasApiUrl: Boolean(apiUrl),
    hasApiSecret: Boolean(apiSecret),
    hasApiKey: Boolean(process.env.HERMES_API_KEY?.trim()),
  };
}

/**
 * Dev-only stub gate. Never active in production.
 * Requires HERMES_STUB_ENABLED=1 and NODE_ENV development|test.
 */
export function canUseHermesStub(): boolean {
  assertServerOnly();
  const env = getServerEnv();
  const config = getHermesEnvConfig();
  return (
    (env.NODE_ENV === "development" || env.NODE_ENV === "test") &&
    config.stubEnabled
  );
}
