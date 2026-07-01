import type { GscInsight, GscMetricsSummary } from "@/lib/integrations/gsc-types";

export type { GscInsight };

export type DashboardGoogleSearchConsole = {
  connected: boolean;
  selectedProperty: string | null;
  metricsSummary: GscMetricsSummary | null;
  lastFetchedAt: string | null;
  insights: GscInsight[];
  tasksCreatedLastSync: number | null;
};

export const EMPTY_DASHBOARD_GSC: DashboardGoogleSearchConsole = {
  connected: false,
  selectedProperty: null,
  metricsSummary: null,
  lastFetchedAt: null,
  insights: [],
  tasksCreatedLastSync: null,
};
