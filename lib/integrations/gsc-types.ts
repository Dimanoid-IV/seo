export type SearchConsoleSite = {
  siteUrl: string;
  permissionLevel: string;
};

export type GscSitesData = {
  sites: SearchConsoleSite[];
  selectedSiteUrl: string | null;
  websiteUrl: string;
  websiteDomain: string;
  hasMatchingProperty: boolean;
  matchingSiteUrl: string | null;
};

export type GscSitesResponse = {
  data: GscSitesData;
};

export type GscSelectSiteResponse = {
  data: {
    siteUrl: string;
    permissionLevel: string;
    websiteUrl: string | null;
    selectedAt: string;
  };
};

export type GscMetricsSummary = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscInsightType = "positive" | "warning" | "opportunity";

export type GscInsight = {
  code: string;
  type: GscInsightType;
  title: string;
  description: string;
  recommendation: string;
};

export type GscMetricsJson = {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: GscMetricsSummary;
  syncedAt: string;
  tasksCreatedLastSync?: number;
};

export type GscSyncResponse = {
  data: GscMetricsJson & {
    tasksCreated: number;
  };
};
