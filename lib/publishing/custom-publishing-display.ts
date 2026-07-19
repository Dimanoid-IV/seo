/**
 * Pure display helpers for custom publishing UI (no secrets).
 */

export type CustomPublishingDisplayState = {
  connected: boolean;
  tested: boolean;
  hostLabel: string | null;
  hasSharedSecret: boolean;
  /** Never include full URL or secret. */
  connectedBanner: string | null;
};

export function buildCustomPublishingDisplayState(input: {
  endpointConfigured?: boolean | null;
  endpointHost?: string | null;
  testedAt?: string | null;
  hasSharedSecret?: boolean | null;
}): CustomPublishingDisplayState {
  const host =
    typeof input.endpointHost === "string" && input.endpointHost.trim()
      ? input.endpointHost.trim().slice(0, 200)
      : null;
  const tested = Boolean(input.testedAt);
  const connected = Boolean(input.endpointConfigured && tested && host);

  return {
    connected,
    tested,
    hostLabel: host,
    hasSharedSecret: input.hasSharedSecret === true,
    connectedBanner: connected && host ? `Подключено: ${host}` : null,
  };
}

/**
 * Article publish path priority for UI copy (WP > webhook > universal).
 */
export function resolveArticlePublishPriority(input: {
  wordpressConnected: boolean;
  webhookTested: boolean;
}): "wordpress_draft" | "webhook" | "universal_package" {
  if (input.wordpressConnected) return "wordpress_draft";
  if (input.webhookTested) return "webhook";
  return "universal_package";
}
