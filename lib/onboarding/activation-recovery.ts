import type { ActivationState } from "./activation-types";

// Longer than the worker's 300-second execution limit. Failed runs back off too.
export const ACTIVATION_LEASE_MS = 6 * 60_000;

export function activationNeedsRecovery(state: ActivationState | null, now = new Date()): boolean {
  if (!state || state.status === "done" || state.status === "idle") return false;
  const timestamps = [state.startedAt, state.finishedAt, ...Object.values(state.steps).map(step => step?.updatedAt)]
    .map(value => value ? Date.parse(value) : 0).filter(Number.isFinite);
  return now.getTime() - Math.max(0, ...timestamps) >= ACTIVATION_LEASE_MS;
}

export function prepareActivationAttempt(previous: ActivationState | null, websiteId: string, now = new Date()): ActivationState {
  return {
    ...(previous?.websiteId === websiteId ? previous : {}),
    version: 1, websiteId, status: "running", startedAt: now.toISOString(),
    finishedAt: undefined, lastError: undefined,
    steps: previous?.websiteId === websiteId ? previous.steps : {},
  };
}
