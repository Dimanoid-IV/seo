export type ReportsGrowthHistoryEntry = {
  id: string;
  score: number;
  previousScore: number | null;
  delta: number | null;
  reason: string | null;
  source: string;
  createdAt: string;
};

export type ReportsActivityEntry = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  archived?: boolean;
};

export type ReportsSavedReport = {
  id: string;
  type: string;
  status: string;
  title: string;
  summary: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

export type ReportsOverviewData = {
  website: {
    id: string;
    url: string;
    currentGrowthScore: number | null;
    lastAuditAt: string | null;
  } | null;
  latestAudit: {
    id: string;
    type: string;
    status: string;
    growthScore: number | null;
    completedAt: string | null;
  } | null;
  growthHistory: ReportsGrowthHistoryEntry[];
  taskStats: {
    completedThisMonth: number;
    activeCount: number;
  };
  lastActivities: ReportsActivityEntry[];
  reports: ReportsSavedReport[];
};

export type ReportsOverviewResponse = {
  data: ReportsOverviewData;
};
