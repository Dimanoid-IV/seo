import "server-only";

import {
  EmailApprovalSource,
  EmailApprovalStatus,
  type EmailApprovalType,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { formatEmailApproval } from "./format";
import { timelineAfterEmailApprovalCreated } from "./hooks";
import type { EmailApprovalViewModel } from "./types";

export type CreateEmailApprovalParams = {
  userId: string;
  websiteId: string;
  organizationId: string;
  type: EmailApprovalType;
  source: EmailApprovalSource;
  sourceId?: string | null;
  subject: string;
  body: string;
  recipientEmail?: string | null;
  language?: string | null;
  relatedPlanId?: string | null;
  relatedArticleIds?: string[];
  relatedSocialPostIds?: string[];
  relatedTaskIds?: string[];
  relatedTimelineEventIds?: string[];
  status?: EmailApprovalStatus;
};

export async function createEmailApproval(
  input: CreateEmailApprovalParams
): Promise<EmailApprovalViewModel> {
  if (!input.subject.trim() || !input.body.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Email subject and body are required."
    );
  }

  const prisma = getPrisma();

  const email = await prisma.emailApproval.create({
    data: {
      userId: input.userId,
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      type: input.type,
      status: input.status ?? EmailApprovalStatus.READY,
      subject: input.subject.trim(),
      body: input.body.trim(),
      recipientEmail: input.recipientEmail?.trim() || null,
      language: input.language ?? null,
      source: input.source,
      sourceId: input.sourceId ?? null,
      relatedPlanId: input.relatedPlanId ?? null,
      relatedArticleIds: input.relatedArticleIds ?? [],
      relatedSocialPostIds: input.relatedSocialPostIds ?? [],
      relatedTaskIds: input.relatedTaskIds ?? [],
      relatedTimelineEventIds: input.relatedTimelineEventIds ?? [],
    },
  });

  try {
    await timelineAfterEmailApprovalCreated({
      userId: input.userId,
      websiteId: input.websiteId,
      emailApprovalId: email.id,
      type: email.type,
      source: email.source,
      sourceId: email.sourceId,
    });
  } catch {
    // Timeline must not block email draft creation.
  }

  return formatEmailApproval(email);
}
