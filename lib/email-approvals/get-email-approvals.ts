import {
  EmailApprovalStatus,
  EmailApprovalType,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";

import { formatEmailApproval } from "./format";
import { isEmailSendingConfigured } from "./send-email-approval";
import {
  findEmailApprovalForUser,
  resolveWebsiteForEmailApprovals,
} from "./resolve-website";
import type { EmailApprovalsListResult } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function decodeCursor(cursor: string | null | undefined): Date | null {
  if (!cursor?.trim()) {
    return null;
  }
  const parsed = new Date(cursor);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getEmailApprovals(input: {
  userId: string;
  organizationId?: string | null;
  websiteId?: string | null;
  status?: EmailApprovalStatus;
  type?: EmailApprovalType;
  limit?: number;
  cursor?: string | null;
}): Promise<EmailApprovalsListResult> {
  const { website } = await resolveWebsiteForEmailApprovals(
    input.userId,
    input.organizationId ?? null,
    input.websiteId
  );

  const prisma = getPrisma();
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursorDate = decodeCursor(input.cursor);

  const where: Prisma.EmailApprovalWhereInput = {
    websiteId: website.id,
    userId: input.userId,
    archivedAt: null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    ...(!input.status
      ? { status: { not: EmailApprovalStatus.ARCHIVED } }
      : {}),
  };

  const rows = await prisma.emailApproval.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    emails: page.map(formatEmailApproval),
    nextCursor: hasMore
      ? page[page.length - 1]?.createdAt.toISOString() ?? null
      : null,
    websiteId: website.id,
    emailSendingConfigured: isEmailSendingConfigured(),
  };
}

export async function getEmailApprovalById(input: {
  emailApprovalId: string;
  userId: string;
}) {
  const email = await findEmailApprovalForUser(
    input.emailApprovalId,
    input.userId
  );

  if (!email) {
    return null;
  }

  return formatEmailApproval(email);
}
