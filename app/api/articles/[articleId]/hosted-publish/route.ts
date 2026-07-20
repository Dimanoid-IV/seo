import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { publishArticleToHostedBlog } from "@/lib/hosted-blog/publish";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await requireUser(request);
    const { articleId } = await context.params;
    const data = await publishArticleToHostedBlog({ articleId, currentUser });
    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
