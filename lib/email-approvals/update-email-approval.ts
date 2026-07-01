import "server-only";

import { EmailApprovalStatus } from "@prisma/client";

import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { formatEmailApproval } from "./format";
import { timelineAfterEmailApprovalApproved } from "./hooks";
import { findEmailApprovalForUser } from "./resolve-website";

export async function updateEmailApproval(input: {
  emailApprovalId: string;
  userId: string;
  data: {
    subject?: string;
    body?: string;
    recipientEmail?: string | null;
    language?: string | null;
    status?: EmailApprovalStatus;
  };
}) {
  const existing = await findEmailApprovalForUser(
    input.emailApprovalId,
    input.userId
  );

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Email approval not found");
  }

  if (existing.status === EmailApprovalStatus.SENT) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Sent emails cannot be edited."
    );
  }

  if (input.data.status === EmailApprovalStatus.SENT) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Use the send endpoint to send emails."
    );
  }

  const prisma = getPrisma();

  const updated = await prisma.emailApproval.update({
    where: { id: existing.id },
    data: {
      subject: input.data.subject?.trim() || undefined,
      body: input.data.body?.trim() || undefined,
      recipientEmail:
        input.data.recipientEmail === undefined
          ? undefined
          : input.data.recipientEmail?.trim() || null,
      language:
        input.data.language === undefined ? undefined : input.data.language,
      status: input.data.status,
    },
  });

  return formatEmailApproval(updated);
}

export async function approveEmailApproval(input: {
  emailApprovalId: string;
  userId: string;
}) {
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

  const prisma = getPrisma();

  const updated = await prisma.emailApproval.update({
    where: { id: existing.id },
    data: {
      status: EmailApprovalStatus.APPROVED,
      approvedAt: new Date(),
    },
  });

  try {
    await timelineAfterEmailApprovalApproved({
      userId: input.userId,
      websiteId: existing.websiteId,
      emailApprovalId: existing.id,
    });
  } catch {
    // Timeline must not block approval.
  }

  return formatEmailApproval(updated);
}

export async function archiveEmailApproval(input: {
  emailApprovalId: string;
  userId: string;
}) {
  const existing = await findEmailApprovalForUser(
    input.emailApprovalId,
    input.userId
  );

  if (!existing) {
    throw new AppError(ErrorCode.NOT_FOUND, "Email approval not found");
  }

  const prisma = getPrisma();

  const updated = await prisma.emailApproval.update({
    where: { id: existing.id },
    data: {
      status: EmailApprovalStatus.ARCHIVED,
      archivedAt: new Date(),
    },
  });

  return formatEmailApproval(updated);
}
