const VERIFICATION_BACKOFF_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  30 * 60_000,
  60 * 60_000,
] as const;

export function publicationVerificationDelayMs(attemptNumber: number): number {
  const index = Math.max(0, Math.min(attemptNumber - 1, VERIFICATION_BACKOFF_MS.length - 1));
  return VERIFICATION_BACKOFF_MS[index];
}

export function nextPublicationVerificationAt(
  now: Date,
  attemptNumber: number
): Date {
  return new Date(now.getTime() + publicationVerificationDelayMs(attemptNumber));
}

export function hasPublicationVerificationAttemptsRemaining(input: {
  attemptCount: number;
  maxAttempts: number;
}): boolean {
  return input.attemptCount < input.maxAttempts;
}
