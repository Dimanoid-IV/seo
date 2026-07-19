/**
 * Pure activation metadata helpers (no server-only) for unit tests.
 */

import {
  ACTIVATION_METADATA_KEY,
  type ActivationState,
} from "./activation-types";

type MetadataBag = Record<string, unknown>;

function asMetadataBag(value: unknown): MetadataBag {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...(value as MetadataBag) };
  }
  return {};
}

export function readActivationFromMetadata(
  metadata: unknown
): ActivationState | null {
  const bag = asMetadataBag(metadata);
  const raw = bag[ACTIVATION_METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const state = raw as ActivationState;
  if (state.version !== 1 || typeof state.websiteId !== "string") return null;
  return state;
}

export function writeActivationIntoMetadata(
  metadata: unknown,
  activation: ActivationState
): MetadataBag {
  const bag = asMetadataBag(metadata);
  return {
    ...bag,
    [ACTIVATION_METADATA_KEY]: activation,
  };
}
