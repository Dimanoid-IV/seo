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
import { sendArticleToNoCodeAutomation } from "@/lib/publishing/no-code-automation";
import { parseNoCodeAutomationProvider } from "@/lib/publishing/no-code-automation-config";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "База данных не настроена.", {
      statusCode: 503,
    });
  }
}

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

const bodySchema = z.object({
  provider: z
    .string()
    .transform((value) => parseNoCodeAutomationProvider(value))
    .refine((value) => value !== null, {
      message: "Provider must be zapier or make.",
    }),
  dryRun: z.boolean().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { articleId } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);

    const prisma = getPrisma();
    const article = await prisma.article.findFirst({
      where: {
        id: articleId,
        deletedAt: null,
        organization: { ownerUserId: currentUser.id, deletedAt: null },
      },
      select: { id: true, websiteId: true, organizationId: true },
    });
    if (!article) throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");

    const result = await sendArticleToNoCodeAutomation({
      articleId: article.id,
      websiteId: article.websiteId,
      organizationId: article.organizationId,
      userId: currentUser.id,
      provider: parsed.data.provider!,
      dryRun: parsed.data.dryRun !== false,
    });
    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
