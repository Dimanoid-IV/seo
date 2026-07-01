/** Current calendar month as `YYYY-MM` (UTC). */
export function currentMonthKey(date = new Date()): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

/** Human-readable month label for UI. */
export function formatContentPlanMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("ru", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}
