export type EmailApprovalViewModel = {
  id: string;
  type: string;
  status: string;
  source: string;
  sourceId?: string;
  subject: string;
  body: string;
  recipientEmail?: string;
  language?: string;
  relatedPlanId?: string;
  relatedArticleIds: string[];
  relatedSocialPostIds: string[];
  relatedTaskIds: string[];
  relatedTimelineEventIds: string[];
  approvedAt?: string;
  sentAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailApprovalsListResult = {
  emails: EmailApprovalViewModel[];
  nextCursor: string | null;
  websiteId: string | null;
  emailSendingConfigured: boolean;
};

export type EmailApprovalSourceSummary = {
  hasMonthlyPlan: boolean;
  hasArticles: boolean;
  hasSocialPosts: boolean;
  hasTasks: boolean;
  hasTimelineEvents: boolean;
  hasEnoughData: boolean;
};
