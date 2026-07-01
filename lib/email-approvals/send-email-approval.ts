import "server-only";

import { EmailApprovalStatus, EmailStatus, EmailType } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { assertCanUseFeature } from "@/lib/billing/feature-gates";
import { FROM_EMAIL, getResendClient } from "@/lib/resend";

import { formatEmailApproval } from "./format";
import { timelineAfterEmailApprovalSent } from "./hooks";
import { findEmailApprovalForUser } from "./resolve-website";

export function isEmailSendingConfigured(): boolean {
  try {
    return Boolean(getServerEnv().RESEND_API_KEY?.trim());
  } catch {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  }
}

export async function sendEmailApproval(input: {
  emailApprovalId: string;
  userId: string;
  recipientEmail?: string | null;
}) {
  if (!isEmailSendingConfigured()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Email sending is not configured yet."
    );
  }

  const existing = await findEmailApprovalForUser(
    input.emailApprovalId,
    input.userId
  );

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Email approval not found");
  }

  if (existing.status === EmailApprovalStatus.SENT) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Email was already sent.");
  }

  if (
    existing.status !== EmailApprovalStatus.APPROVED &&
    existing.status !== EmailApprovalStatus.READY
  ) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Approve the email before sending."
    );
  }

  await assertCanUseFeature({
    userId: input.userId,
    organizationId: existing.organizationId,
    feature: "emailSend",
    message:
      "Email sending is not available on your current plan. Upgrade to continue.",
  });

  const recipient =
    input.recipientEmail?.trim() ||
    existing.recipientEmail?.trim();

  if (!recipient) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Recipient email is required to send."
    );
  }

  const prisma = getPrisma();
  const resend = getResendClient();

  let resendId: string | null = null;
  let errorMessage: string | null = null;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: existing.subject,
      text: existing.body,
    });

    resendId =
      typeof result.data?.id === "string" ? result.data.id : null;
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Failed to send email.";
    throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
  }

  const updated = await prisma.emailApproval.update({
    where: { id: existing.id },
    data: {
      status: EmailApprovalStatus.SENT,
      sentAt: new Date(),
      recipientEmail: recipient,
    },
  });

  try {
    await prisma.emailLog.create({
      data: {
        organizationId: existing.organizationId,
        websiteId: existing.websiteId,
        userId: existing.userId,
        toEmail: recipient,
        fromEmail: FROM_EMAIL,
        subject: existing.subject,
        type: EmailType.SYSTEM_ALERT,
        status: EmailStatus.SENT,
        resendId,
        sentAt: new Date(),
      },
    });
  } catch {
    // Email log must not block send confirmation.
  }

  try {
    await timelineAfterEmailApprovalSent({
      userId: input.userId,
      websiteId: existing.websiteId,
      emailApprovalId: existing.id,
      recipientEmail: recipient,
    });
  } catch {
    // Timeline must not block send.
  }

  return formatEmailApproval(updated);
}
