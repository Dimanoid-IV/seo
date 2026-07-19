import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { runWordPressRollbackForArticle } from "@/lib/integrations/adapters/wordpress/run-rollback";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = { params: Promise<{ articleId: string }> };

const bodySchema = z.object({
  targetStatus: z.enum(["draft", "private"]).optional(),
});

/**
 * POST /api/articles/[articleId]/wordpress-rollback
 * Moves RankBoost-published WP post to draft/private — never deletes.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { articleId } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const prisma = getPrisma();
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        deletedAt: null,
        website: {
          deletedAt: null,
          organization: {
            ownerUserId: currentUser.id,
            deletedAt: null,
          },
        },
      },
      select: {
        id: true,
        websiteId: true,
        organizationId: true,
        status: true,
        wordpressPostId: true,
        wordpressPublishedUrl: true,
      },
    });
    if (!article) {
      throw new AppError(ErrorCode.NOT_FOUND, "Article not found");
    }
    if (
      currentUser.organizationId &&
      currentUser.organizationId !== article.organizationId
    ) {
      throw new AppError(ErrorCode.NOT_FOUND, "Article not found");
    }

    const result = await runWordPressRollbackForArticle({
      userId: currentUser.id,
      organizationId: article.organizationId,
      websiteId: article.websiteId,
      articleId: article.id,
      targetStatus: parsed.data.targetStatus ?? "draft",
    });

    if (!result.allowed) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        result.gate.userSafeMessage
      );
    }

    return authJsonResponse({
      data: {
        rolledBack: result.rolledBack,
        jobId: result.jobId,
        articleStatus: result.articleStatus,
        wordpressPostId: result.wordpressPostId,
        wordpressStatus: result.wordpressStatus,
        summaryKey: result.summaryKey,
        publishedUrlKept: article.wordpressPublishedUrl,
        warning:
          "This changes the WordPress post status to draft/private. The post is not deleted.",
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
