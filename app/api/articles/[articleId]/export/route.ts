import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getArticleUniversalExport } from "@/lib/publishing/get-article-export";

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

export async function GET(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { articleId } = await context.params;

    const result = await getArticleUniversalExport({ articleId, currentUser });

    const url = new URL(request.url);
    const format = url.searchParams.get("format");

    // Raw downloads for convenience; default returns the full JSON package.
    if (format === "html") {
      return new Response(result.export.html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${result.export.slug}.html"`,
        },
      });
    }
    if (format === "md" || format === "markdown") {
      return new Response(result.export.markdown, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${result.export.slug}.md"`,
        },
      });
    }

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
