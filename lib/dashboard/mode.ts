export type DashboardMode = "simple" | "advanced";

export const DASHBOARD_MODE_STORAGE_KEY = "rankboost.dashboardMode";

export const DEFAULT_DASHBOARD_MODE: DashboardMode = "simple";

export function readDashboardMode(): DashboardMode {
  if (typeof window === "undefined") {
    return DEFAULT_DASHBOARD_MODE;
  }

  const stored = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return stored === "advanced" ? "advanced" : DEFAULT_DASHBOARD_MODE;
}

export function writeDashboardMode(mode: DashboardMode): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, mode);
  notifyDashboardModeChange();
}

const dashboardModeListeners = new Set<() => void>();

export function subscribeDashboardMode(listener: () => void): () => void {
  dashboardModeListeners.add(listener);
  return () => {
    dashboardModeListeners.delete(listener);
  };
}

export function notifyDashboardModeChange(): void {
  dashboardModeListeners.forEach((listener) => listener());
}

export function isAdvancedAppRoute(pathname: string): boolean {
  return ADVANCED_APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const ADVANCED_APP_ROUTE_PREFIXES = [
  "/app/autopilot-control",
  "/app/autopilot",
  "/app/timeline",
  "/app/social-posts",
  "/app/email-approvals",
  "/app/reports",
] as const;
