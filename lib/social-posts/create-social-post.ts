import "server-only";

import {
  SocialPostSource,
  SocialPostStatus,
  WebsiteStatus,
  type Prisma,
  type SocialPlatform,
  type WebsiteLanguage,
} from "@prisma/client";

import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";

import { formatSocialPost } from "./format";
import type { SocialPostQualityIssue, SocialPostViewModel } from "./types";

export type CreateSocialPostParams = {
  userId: string;
  websiteId: string;
  organizationId: string;
  title: string;
  content: string;
  platform: SocialPlatform;
  language: WebsiteLanguage;
  source?: SocialPostSource;
  sourceId?: string | null;
  hook?: string | null;
  hashtags?: string[];
  cta?: string | null;
  qualityScore?: number | null;
  qualityIssues?: SocialPostQualityIssue[] | null;
  status?: SocialPostStatus;
  generatedByAIJobId?: string | null;
  articleId?: string | null;
};

export async function createSocialPost(
  input: CreateSocialPostParams
): Promise<SocialPostViewModel> {
  if (!input.title.trim() || !input.content.trim()) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Social post title and content are required."
    );
  }

  const prisma = getPrisma();

  const post = await prisma.socialPost.create({
    data: {
      userId: input.userId,
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      title: input.title.trim(),
      text: input.content.trim(),
      platform: input.platform,
      language: input.language,
      status: input.status ?? SocialPostStatus.DRAFT,
      source: input.source ?? SocialPostSource.MANUAL,
      sourceId: input.sourceId ?? null,
      hook: input.hook ?? null,
      hashtagsJson: input.hashtags?.length
        ? (input.hashtags as Prisma.InputJsonValue)
        : undefined,
      cta: input.cta ?? null,
      qualityScore: input.qualityScore ?? null,
      qualityIssuesJson: input.qualityIssues?.length
        ? (input.qualityIssues as Prisma.InputJsonValue)
        : undefined,
      generatedByAIJobId: input.generatedByAIJobId ?? null,
      articleId: input.articleId ?? null,
    },
  });

  try {
    const { timelineAfterSocialPostDraftCreated } = await import(
      "@/lib/timeline/hooks"
    );
    await timelineAfterSocialPostDraftCreated({
      userId: input.userId,
      websiteId: input.websiteId,
      socialPostId: post.id,
      title: post.title ?? post.hook ?? "Social post draft",
      platform: post.platform,
      source: post.source,
      sourceId: post.sourceId,
    });
  } catch {
    // Timeline must not block social post creation.
  }

  return formatSocialPost(post);
}

export async function resolveWebsiteForSocialPosts(
  userId: string,
  organizationId: string | null,
  websiteId?: string | null
) {
  const prisma = getPrisma();

  let organization = organizationId
    ? await prisma.organization.findFirst({
        where: { id: organizationId, ownerUserId: userId, deletedAt: null },
      })
    : null;

  if (!organization) {
    organization = await findPrimaryOrganization(prisma, userId);
  }

  if (!organization) {
    throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
  }

  const website = websiteId
    ? await prisma.website.findFirst({
        where: {
          id: websiteId,
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        select: {
          id: true,
          url: true,
          niche: true,
          primaryLanguage: true,
          organizationId: true,
        },
      })
    : await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          url: true,
          niche: true,
          primaryLanguage: true,
          organizationId: true,
        },
      });

  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Add a website first");
  }

  return { organization, website };
}

export async function findSocialPostForUser(
  socialPostId: string,
  userId: string
) {
  const prisma = getPrisma();

  return prisma.socialPost.findFirst({
    where: {
      id: socialPostId,
      deletedAt: null,
      organization: {
        ownerUserId: userId,
        deletedAt: null,
      },
    },
  });
}
