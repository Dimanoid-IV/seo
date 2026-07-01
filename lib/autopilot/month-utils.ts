/** Validates and normalizes `YYYY-MM` month keys. */
export function normalizeMonthKey(value: string | undefined | null): string {
  if (value?.trim()) {
    const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (match) {
      const month = Number.parseInt(match[2], 10);
      if (month >= 1 && month <= 12) {
        return `${match[1]}-${match[2]}`;
      }
    }
    throw new Error("Invalid month format. Use YYYY-MM.");
  }

  return currentMonthKey();
}

/** Current calendar month as `YYYY-MM` (UTC). */
export function currentMonthKey(date = new Date()): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

/** UTC date range for a month key (inclusive start, exclusive end). */
export function getMonthDateRange(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

/** Previous month key. */
export function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 2, 1));
  return currentMonthKey(date);
}

/** Human-readable month label for UI. */
export function formatAutopilotMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}
