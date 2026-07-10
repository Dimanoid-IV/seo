export type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  source: string;
  impactScore: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  whyItMatters: string | null;
  recommendedAction: string | null;
  estimatedFixMinutes: number | null;
  auditCheckCode: string | null;
};

export type TaskIntegrationsContext = {
  gscConnected: boolean;
  gscPropertySelected: boolean;
  wordpressConnected: boolean;
};

export type TasksOverviewData = {
  website: { id: string; url: string } | null;
  tasks: TaskListItem[];
  integrations: TaskIntegrationsContext;
};

export type TasksOverviewResponse = {
  data: TasksOverviewData;
};
