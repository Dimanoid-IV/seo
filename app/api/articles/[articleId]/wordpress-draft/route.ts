import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { createWordPressDraftForArticle } from "@/lib/integrations/wordpress-drafts";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { articleId } = await context.params;

    const result = await createWordPressDraftForArticle({
      articleId,
      userId: currentUser.id,
    });

    return authJsonResponse({
      data: {
        postId: result.postId,
        editUrl: result.editUrl,
        articleId: result.articleId,
        status: result.status,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
