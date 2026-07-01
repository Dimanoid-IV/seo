import {
  SocialPlatform,
  SocialPostSource,
  SocialPostStatus,
  type Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";

import { formatSocialPost } from "./format";
import {
  findSocialPostForUser,
  resolveWebsiteForSocialPosts,
} from "./create-social-post";
import type { SocialPostsListResult } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function decodeCursor(cursor: string | null | undefined): Date | null {
  if (!cursor?.trim()) {
    return null;
  }
  const parsed = new Date(cursor);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function getSocialPosts(input: {
  userId: string;
  organizationId?: string | null;
  websiteId?: string | null;
  status?: SocialPostStatus;
  platform?: SocialPlatform;
  source?: SocialPostSource;
  limit?: number;
  cursor?: string | null;
  includeArchived?: boolean;
}): Promise<SocialPostsListResult> {
  const { website } = await resolveWebsiteForSocialPosts(
    input.userId,
    input.organizationId ?? null,
    input.websiteId
  );

  const prisma = getPrisma();
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const cursorDate = decodeCursor(input.cursor);

  const where: Prisma.SocialPostWhereInput = {
    websiteId: website.id,
    deletedAt: null,
    ...(input.status ? { status: input.status } : {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    ...(!input.includeArchived && !input.status
      ? { status: { not: SocialPostStatus.ARCHIVED } }
      : {}),
  };

  const rows = await prisma.socialPost.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    posts: page.map(formatSocialPost),
    nextCursor: hasMore
      ? page[page.length - 1]?.createdAt.toISOString() ?? null
      : null,
    websiteId: website.id,
  };
}

export async function getSocialPostForUser(input: {
  socialPostId: string;
  userId: string;
}) {
  const post = await findSocialPostForUser(input.socialPostId, input.userId);

  if (!post || post.deletedAt) {
    return null;
  }

  return formatSocialPost(post);
}
