import "server-only";

import {
  ArticleStatus,
  EmailApprovalStatus,
  SocialPostStatus,
  TaskStatus,
  WebsiteStatus,
} from "@prisma/client";

import { resolveOwnedOrganization } from "@/lib/auth/queries";
import type { CurrentUser } from "@/lib/auth/types";
import { getPrisma } from "@/lib/db";
import { parsePreparedFix } from "@/lib/tasks/prepared-fix";

import type {
  ReviewItemGroup,
  ReviewItemStatus,
  ReviewItemType,
  ReviewQueueData,
  ReviewQueueItem,
} from "./types";

function reviewItemId(type: ReviewItemType, sourceId: string): string {
  return `${type}:${sourceId}`;
}

function mapEmailStatus(status: EmailApprovalStatus): ReviewItemStatus {
  if (status === EmailApprovalStatus.APPROVED) {
    return "APPROVED";
  }
  if (status === EmailApprovalStatus.READY) {
    return "READY_TO_PUBLISH";
  }
  return "DRAFT";
}

function mapArticleStatus(status: ArticleStatus): ReviewItemStatus {
  if (status === ArticleStatus.APPROVED) {
    return "APPROVED";
  }
  if (status === ArticleStatus.WORDPRESS_DRAFT_CREATED) {
    return "READY_TO_PUBLISH";
  }
  if (status === ArticleStatus.WAITING_REVIEW) {
    return "AWAITING_REVIEW";
  }
  return "DRAFT";
}

function mapSocialStatus(status: SocialPostStatus): ReviewItemStatus {
  if (status === SocialPostStatus.APPROVED) {
    return "APPROVED";
  }
  if (status === SocialPostStatus.READY) {
    return "AWAITING_REVIEW";
  }
  return "DRAFT";
}

function truncatePreview(text: string, max = 280): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1)}…`;
}

function countByGroup(items: ReviewQueueItem[]): ReviewQueueData["counts"] {
  const counts = {
    total: items.length,
    seo: 0,
    content: 0,
    social: 0,
    email: 0,
  };

  for (const item of items) {
    if (item.group === "SEO") counts.seo += 1;
    if (item.group === "CONTENT") counts.content += 1;
    if (item.group === "SOCIAL") counts.social += 1;
    if (item.group === "EMAIL") counts.email += 1;
  }

  return counts;
}

function sortReviewItems(items: ReviewQueueItem[]): ReviewQueueItem[] {
  const statusOrder: Record<ReviewItemStatus, number> = {
    AWAITING_REVIEW: 0,
    DRAFT: 1,
    READY_TO_PUBLISH: 2,
    APPROVED: 3,
    REJECTED: 4,
  };

  return [...items].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) {
      return statusDiff;
    }
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function getReviewQueue(
  currentUser: CurrentUser
): Promise<ReviewQueueData> {
  const prisma = getPrisma();

  const organization = await resolveOwnedOrganization(
    prisma,
    currentUser.id,
    currentUser.organizationId
  );

  const website = organization
    ? await prisma.website.findFirst({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: WebsiteStatus.ACTIVE,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true },
      })
    : null;

  if (!website) {
    return {
      website: null,
      items: [],
      counts: { total: 0, seo: 0, content: 0, social: 0, email: 0 },
    };
  }

  const userId = currentUser.id;

  const [emails, articles, socialPosts, tasksWithFixes] = await Promise.all([
    prisma.emailApproval.findMany({
      where: {
        websiteId: website.id,
        userId,
        archivedAt: null,
        status: {
          in: [EmailApprovalStatus.DRAFT, EmailApprovalStatus.READY],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        body: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        relatedTaskIds: true,
      },
    }),
    prisma.article.findMany({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: {
          in: [
            ArticleStatus.DRAFT,
            ArticleStatus.IDEA,
            ArticleStatus.WAITING_REVIEW,
            ArticleStatus.WORDPRESS_DRAFT_CREATED,
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        contentHtml: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.socialPost.findMany({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: {
          in: [SocialPostStatus.DRAFT, SocialPostStatus.READY],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        text: true,
        platform: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        websiteId: website.id,
        deletedAt: null,
        status: {
          in: [
            TaskStatus.OPEN,
            TaskStatus.IN_PROGRESS,
            TaskStatus.WAITING_REVIEW,
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        recommendationJson: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const items: ReviewQueueItem[] = [];

  for (const email of emails) {
    items.push({
      id: reviewItemId("EMAIL_DRAFT", email.id),
      sourceId: email.id,
      type: "EMAIL_DRAFT",
      group: "EMAIL",
      title: email.subject,
      preview: truncatePreview(email.body),
      status: mapEmailStatus(email.status),
      sourceTaskId: email.relatedTaskIds[0],
      createdAt: email.createdAt.toISOString(),
      updatedAt: email.updatedAt.toISOString(),
      editHref: "/app/email-approvals",
      canEdit: true,
      canApprove: true,
    });
  }

  for (const article of articles) {
    const previewSource = article.contentHtml
      ? article.contentHtml.replace(/<[^>]+>/g, " ")
      : article.title;

    items.push({
      id: reviewItemId("ARTICLE_DRAFT", article.id),
      sourceId: article.id,
      type: "ARTICLE_DRAFT",
      group: "CONTENT",
      title: article.title,
      preview: truncatePreview(previewSource),
      status: mapArticleStatus(article.status),
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
      editHref: `/app/articles/${article.id}`,
      canEdit: true,
      canApprove: true,
    });
  }

  for (const post of socialPosts) {
    items.push({
      id: reviewItemId("SOCIAL_POST", post.id),
      sourceId: post.id,
      type: "SOCIAL_POST",
      group: "SOCIAL",
      title: post.title ?? `${post.platform} post`,
      preview: truncatePreview(post.text),
      status: mapSocialStatus(post.status),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      editHref: "/app/social-posts",
      canEdit: true,
      canApprove: true,
    });
  }

  for (const task of tasksWithFixes) {
    const preparedFix = parsePreparedFix(
      task.recommendationJson &&
        typeof task.recommendationJson === "object" &&
        "preparedFix" in (task.recommendationJson as Record<string, unknown>)
        ? (task.recommendationJson as Record<string, unknown>).preparedFix
        : null
    );

    if (!preparedFix || preparedFix.status !== "AWAITING_REVIEW") {
      continue;
    }

    const fixType: ReviewItemType = preparedFix.type;
    const group: Exclude<ReviewItemGroup, "ALL"> = "SEO";

    items.push({
      id: reviewItemId(fixType, task.id),
      sourceId: task.id,
      type: fixType,
      group,
      title: preparedFix.title,
      preview: truncatePreview(preparedFix.preview),
      status: "AWAITING_REVIEW",
      sourceTaskId: task.id,
      sourceTaskTitle: task.title,
      createdAt: preparedFix.createdAt,
      updatedAt: preparedFix.updatedAt,
      canEdit: true,
      canApprove: true,
      preparedFix: {
        generatedBy: preparedFix.generatedBy,
        fallbackUsed: preparedFix.fallbackUsed,
        summary: preparedFix.summary,
        whyItMatters: preparedFix.whyItMatters,
        implementationNotes: preparedFix.implementationNotes,
        riskLevel: preparedFix.riskLevel,
        approvalRequired: preparedFix.approvalRequired,
      },
    });
  }

  const sorted = sortReviewItems(items);

  return {
    website: { id: website.id, url: website.url },
    items: sorted,
    counts: countByGroup(sorted),
  };
}

export async function getReviewQueueCount(
  currentUser: CurrentUser
): Promise<number> {
  const queue = await getReviewQueue(currentUser);
  return queue.counts.total;
}
