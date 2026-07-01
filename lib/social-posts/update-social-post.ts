import {
  SocialPlatform,
  SocialPostStatus,
  type Prisma,
} from "@prisma/client";

import { AppError, ErrorCode } from "@/lib/errors";

import {
  findSocialPostForUser,
} from "./create-social-post";
import { formatSocialPost } from "./format";
import { validateSocialPostQuality } from "./quality";

export async function updateSocialPost(input: {
  socialPostId: string;
  userId: string;
  data: {
    title?: string;
    content?: string;
    platform?: SocialPlatform;
    status?: SocialPostStatus;
    hashtags?: string[];
    cta?: string | null;
    scheduledFor?: string | null;
  };
}) {
  const existing = await findSocialPostForUser(input.socialPostId, input.userId);

  if (!existing || existing.deletedAt) {
    throw new AppError(ErrorCode.NOT_FOUND, "Social post not found");
  }

  if (input.data.status === SocialPostStatus.PUBLISHED_EXTERNALLY) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Publishing is not available in this version."
    );
  }

  const nextTitle = input.data.title?.trim() ?? existing.title ?? existing.hook ?? "Social post draft";
  const nextContent = input.data.content?.trim() ?? existing.text;
  const nextPlatform = input.data.platform ?? existing.platform;
  const nextHashtags =
    input.data.hashtags ??
    (Array.isArray(existing.hashtagsJson)
      ? (existing.hashtagsJson as string[])
      : []);
  const nextCta = input.data.cta === undefined ? existing.cta : input.data.cta;

  const contentChanged =
    input.data.content !== undefined ||
    input.data.title !== undefined ||
    input.data.platform !== undefined ||
    input.data.cta !== undefined;

  let qualityScore = existing.qualityScore;
  let qualityIssuesForUpdate: Prisma.InputJsonValue | undefined =
    existing.qualityIssuesJson === null
      ? undefined
      : (existing.qualityIssuesJson as Prisma.InputJsonValue);
  let status = input.data.status ?? existing.status;

  if (contentChanged) {
    const quality = validateSocialPostQuality({
      title: nextTitle,
      text: nextContent,
      platform: nextPlatform,
      language: existing.language,
      cta: nextCta,
      hashtags: nextHashtags,
    });
    qualityScore = quality.qualityScore;
    qualityIssuesForUpdate = quality.issues as Prisma.InputJsonValue;
    status = quality.passed ? SocialPostStatus.READY : SocialPostStatus.DRAFT;
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();

  const updated = await prisma.socialPost.update({
    where: { id: existing.id },
    data: {
      title: nextTitle,
      text: nextContent,
      platform: nextPlatform,
      status,
      hashtagsJson: nextHashtags.length
        ? (nextHashtags as Prisma.InputJsonValue)
        : undefined,
      cta: nextCta,
      qualityScore,
      qualityIssuesJson: qualityIssuesForUpdate,
      scheduledFor: input.data.scheduledFor
        ? new Date(input.data.scheduledFor)
        : input.data.scheduledFor === null
          ? null
          : undefined,
    },
  });

  return formatSocialPost(updated);
}
