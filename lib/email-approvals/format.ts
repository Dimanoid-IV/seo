import type { EmailApproval } from "@prisma/client";

import type { EmailApprovalViewModel } from "./types";

export function formatEmailApproval(email: EmailApproval): EmailApprovalViewModel {
  return {
    id: email.id,
    type: email.type.toLowerCase(),
    status: email.status.toLowerCase(),
    source: email.source.toLowerCase(),
    sourceId: email.sourceId ?? undefined,
    subject: email.subject,
    body: email.body,
    recipientEmail: email.recipientEmail ?? undefined,
    language: email.language ?? undefined,
    relatedPlanId: email.relatedPlanId ?? undefined,
    relatedArticleIds: email.relatedArticleIds,
    relatedSocialPostIds: email.relatedSocialPostIds,
    relatedTaskIds: email.relatedTaskIds,
    relatedTimelineEventIds: email.relatedTimelineEventIds,
    approvedAt: email.approvedAt?.toISOString(),
    sentAt: email.sentAt?.toISOString(),
    archivedAt: email.archivedAt?.toISOString(),
    createdAt: email.createdAt.toISOString(),
    updatedAt: email.updatedAt.toISOString(),
  };
}
