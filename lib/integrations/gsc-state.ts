import { IntegrationStatus } from "@prisma/client";

/**
 * Canonical Google Search Console connection state.
 *
 * Distinguishes "Google OAuth is connected but no Search Console property has
 * been selected yet" (partial) from a fully connected & syncing property. This
 * keeps every surface (integrations hub, autopilot control center, dashboard)
 * honest and consistent instead of showing "Connected and syncing" for a token
 * that cannot sync anything yet.
 */
export type GscConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "GOOGLE_CONNECTED_NO_PROPERTY"
  | "CONNECTED"
  | "ERROR"
  | "NEEDS_REAUTH";

export function resolveGscConnectionState(input: {
  integrationStatus: IntegrationStatus | null | undefined;
  selectedProperty: string | null | undefined;
  hasError?: boolean;
}): GscConnectionState {
  const { integrationStatus, selectedProperty, hasError } = input;

  if (integrationStatus === IntegrationStatus.ERROR || hasError) {
    return "ERROR";
  }

  if (integrationStatus === IntegrationStatus.REVOKED) {
    return "NEEDS_REAUTH";
  }

  if (integrationStatus === IntegrationStatus.CONNECTING) {
    return "CONNECTING";
  }

  if (integrationStatus === IntegrationStatus.CONNECTED) {
    return selectedProperty ? "CONNECTED" : "GOOGLE_CONNECTED_NO_PROPERTY";
  }

  return "DISCONNECTED";
}

/** True only when a property is selected and the integration is healthy. */
export function isGscFullyConnected(state: GscConnectionState): boolean {
  return state === "CONNECTED";
}

/** True when Google OAuth exists but the property still needs to be picked. */
export function isGscAwaitingPropertySelection(
  state: GscConnectionState
): boolean {
  return state === "GOOGLE_CONNECTED_NO_PROPERTY";
}
