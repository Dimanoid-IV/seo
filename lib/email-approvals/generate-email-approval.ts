import "server-only";

import type {
  EmailApprovalSource,
  EmailApprovalType,
} from "@prisma/client";

import { AppError, ErrorCode } from "@/lib/errors";
import {
  assertUsageLimit,
  recordUsage,
} from "@/lib/billing/feature-gates";

import { buildEmailContent } from "./build-email-content";
import { createEmailApproval } from "./create-email-approval";
import { resolveWebsiteForEmailApprovals } from "./resolve-website";
import { getEmailApprovalSourceData } from "./source-data";
import type { EmailApprovalViewModel } from "./types";

export async function generateEmailApprovalDraft(input: {
  userId: string;
  organizationId: string | null;
  websiteId?: string | null;
  type: EmailApprovalType;
  source: EmailApprovalSource;
  sourceId?: string | null;
  language?: string | null;
  recipientEmail?: string | null;
}): Promise<EmailApprovalViewModel> {
  const { organization, website } = await resolveWebsiteForEmailApprovals(
    input.userId,
    input.organizationId,
    input.websiteId
  );

  const sourceData = await getEmailApprovalSourceData({
    userId: input.userId,
    websiteId: website.id,
    organizationId: organization.id,
    type: input.type,
    source: input.source,
    sourceId: input.sourceId,
  });

  if (!sourceData.sourceSummary.hasEnoughData) {
    throw new AppError(
      ErrorCode.NOT_FOUND,
      "RankBoost needs something to review before preparing an email."
    );
  }

  await assertUsageLimit({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "EMAIL_APPROVAL",
    message:
      "You've reached the monthly email approval limit for your current plan. Upgrade to continue.",
  });

  const { subject, body } = buildEmailContent(input.type, sourceData);

  const approval = await createEmailApproval({
    userId: input.userId,
    websiteId: website.id,
    organizationId: organization.id,
    type: input.type,
    source: input.source,
    sourceId: input.sourceId ?? sourceData.relatedPlanId ?? null,
    subject,
    body,
    recipientEmail: input.recipientEmail ?? sourceData.userEmail,
    language: input.language ?? website.primaryLanguage,
    relatedPlanId: sourceData.relatedPlanId,
    relatedArticleIds: sourceData.relatedArticleIds,
    relatedSocialPostIds: sourceData.relatedSocialPostIds,
    relatedTaskIds: sourceData.relatedTaskIds,
    relatedTimelineEventIds: sourceData.relatedTimelineEventIds,
  });

  await recordUsage({
    userId: input.userId,
    organizationId: organization.id,
    websiteId: website.id,
    key: "EMAIL_APPROVAL",
  });

  return approval;
}
