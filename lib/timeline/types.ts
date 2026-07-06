import type {
  TimelineEventSeverity,
  TimelineEventSource,
  TimelineEventType,
} from "@prisma/client";

export type CreateTimelineEventInput = {
  userId: string;
  websiteId: string;
  type: TimelineEventType;
  source: TimelineEventSource;
  title: string;
  summary?: string | null;
  details?: Record<string, unknown> | null;
  severity?: TimelineEventSeverity;
  relatedTaskId?: string | null;
  relatedArticleId?: string | null;
  relatedReportId?: string | null;
  relatedIntegration?: string | null;
  dedupeWindowMs?: number;
};

export type TimelineEventViewModel = {
  id: string;
  type: string;
  source: string;
  severity: string;
  title: string;
  summary?: string;
  createdAt: string;
  relativeTime: string;
  isRead: boolean;
  action?: {
    label: string;
    href: string;
  };
};

export type TimelineSummary = {
  totalEvents: number;
  importantEvents: TimelineEventViewModel[];
  newTasksCount: number;
  completedTasksCount: number;
  opportunitiesCount: number;
  warningsCount: number;
  scoreDelta?: number;
  headline: string;
};

export type TimelineListResult = {
  events: TimelineEventViewModel[];
  unreadCount: number;
  summary: TimelineSummary;
  websiteId: string | null;
  nextCursor: string | null;
};

export type TimelineQuery = {
  limit?: number;
  cursor?: string | null;
  type?: TimelineEventType;
  source?: TimelineEventSource;
  locale?: import("@/lib/i18n/saas/locales").SaasLocale;
};
