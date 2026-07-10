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
};

export type TasksOverviewData = {
  website: { id: string; url: string } | null;
  tasks: TaskListItem[];
};

export type TasksOverviewResponse = {
  data: TasksOverviewData;
};
