import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { AppError, ErrorCode } from "@/lib/errors";
import { runDuePublicationVerifications } from "@/lib/publishing/run-publication-verifications";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await requireUser(request);
    const { articleId } = await context.params;
    const prisma = getPrisma();
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        deletedAt: null,
        organization: {
          ownerUserId: currentUser.id,
          deletedAt: null,
        },
      },
      select: { id: true, organizationId: true },
    });

    if (!article) {
      throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
    }

    const verification = await runDuePublicationVerifications({
      articleId: article.id,
      organizationId: article.organizationId,
      ignoreSchedule: true,
      limit: 1,
    });
    const updated = await prisma.article.findUnique({
      where: { id: article.id },
      select: {
        status: true,
        wordpressPublishedUrl: true,
        publishedAt: true,
      },
    });

    return authJsonResponse({ data: { verification, article: updated } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
