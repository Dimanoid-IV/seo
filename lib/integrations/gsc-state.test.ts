/**
 * Deterministic checks for GSC connection state resolution.
 * Run with: npx tsx lib/integrations/gsc-state.test.ts
 */
import assert from "node:assert/strict";

import { IntegrationStatus } from "@prisma/client";

import {
  isGscAwaitingPropertySelection,
  isGscFullyConnected,
  resolveGscConnectionState,
} from "./gsc-state";

function runGscStateChecks(): void {
  // Disconnected: no integration row / disconnected status.
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: undefined,
      selectedProperty: null,
    }),
    "DISCONNECTED"
  );
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: IntegrationStatus.DISCONNECTED,
      selectedProperty: null,
    }),
    "DISCONNECTED"
  );

  // Token exists but no property selected → partial.
  const partial = resolveGscConnectionState({
    integrationStatus: IntegrationStatus.CONNECTED,
    selectedProperty: null,
  });
  assert.equal(partial, "GOOGLE_CONNECTED_NO_PROPERTY");
  assert.equal(isGscAwaitingPropertySelection(partial), true);
  assert.equal(isGscFullyConnected(partial), false);

  // Property selected → fully connected.
  const full = resolveGscConnectionState({
    integrationStatus: IntegrationStatus.CONNECTED,
    selectedProperty: "sc-domain:popart.ee",
  });
  assert.equal(full, "CONNECTED");
  assert.equal(isGscFullyConnected(full), true);
  assert.equal(isGscAwaitingPropertySelection(full), false);

  // Error status wins even if a property was previously selected.
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: IntegrationStatus.ERROR,
      selectedProperty: "sc-domain:popart.ee",
    }),
    "ERROR"
  );

  // lastErrorMessage present is treated as an error even when CONNECTED.
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: IntegrationStatus.CONNECTED,
      selectedProperty: "sc-domain:popart.ee",
      hasError: true,
    }),
    "ERROR"
  );

  // Revoked token requires re-auth.
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: IntegrationStatus.REVOKED,
      selectedProperty: null,
    }),
    "NEEDS_REAUTH"
  );

  // Connecting is its own transient state.
  assert.equal(
    resolveGscConnectionState({
      integrationStatus: IntegrationStatus.CONNECTING,
      selectedProperty: null,
    }),
    "CONNECTING"
  );
}

if (require.main === module) {
  runGscStateChecks();
  console.log("gsc-state checks passed");
}

export { runGscStateChecks };
