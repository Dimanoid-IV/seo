import "server-only";

/** Resolves dashboard app base URL for absolute links in email bodies. */
export function getAppBaseUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, "")}/app`;
  }

  return null;
}

export function appLink(path: string, label: string): string {
  const base = getAppBaseUrl();
  if (!base) {
    return label;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const href = `${base}${normalizedPath.startsWith("/app") ? normalizedPath : `/app${normalizedPath}`}`;
  return `${label}: ${href}`;
}

export function formatAutopilotMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    parsed
  );
}

export function currentMonthKey(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}
