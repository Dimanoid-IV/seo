import { SocialPostStatus } from "@prisma/client";

import { AppError, ErrorCode } from "@/lib/errors";

import { findSocialPostForUser } from "./create-social-post";
import { formatSocialPost } from "./format";

export async function archiveSocialPost(input: {
  socialPostId: string;
  userId: string;
}) {
  const existing = await findSocialPostForUser(input.socialPostId, input.userId);

  if (!existing || existing.deletedAt) {
    throw new AppError(ErrorCode.NOT_FOUND, "Social post not found");
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const now = new Date();

  const updated = await prisma.socialPost.update({
    where: { id: existing.id },
    data: {
      status: SocialPostStatus.ARCHIVED,
      deletedAt: now,
    },
  });

  return formatSocialPost(updated);
}

export async function markSocialPostCopied(input: {
  socialPostId: string;
  userId: string;
}) {
  const existing = await findSocialPostForUser(input.socialPostId, input.userId);

  if (!existing || existing.deletedAt) {
    throw new AppError(ErrorCode.NOT_FOUND, "Social post not found");
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();
  const now = new Date();

  const updated = await prisma.socialPost.update({
    where: { id: existing.id },
    data: {
      status: SocialPostStatus.COPIED,
      copiedAt: now,
    },
  });

  try {
    const { timelineAfterSocialPostCopied } = await import("@/lib/timeline/hooks");
    await timelineAfterSocialPostCopied({
      userId: input.userId,
      websiteId: existing.websiteId,
      socialPostId: existing.id,
      title: existing.title ?? existing.hook ?? "Social post draft",
    });
  } catch {
    // Timeline must not block copy tracking.
  }

  return formatSocialPost(updated);
}
