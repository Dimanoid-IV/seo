/**
 * Minimal server-side logging helpers. Never pass secrets or tokens in meta.
 */
export function safeLogError(
  scope: string,
  error: unknown,
  meta?: Record<string, unknown>
): void {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

  console.error(`[${scope}]`, {
    ...meta,
    message,
  });
}

export function safeLogWarn(
  scope: string,
  message: string,
  meta?: Record<string, unknown>
): void {
  console.warn(`[${scope}]`, { ...meta, message });
}
