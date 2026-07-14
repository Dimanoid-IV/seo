import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import {
  getArticleForUser,
  updateArticleForUser,
} from "@/lib/articles/article-actions";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

const updateArticleSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    slug: z.string().max(200).nullable().optional(),
    metaTitle: z.string().max(200).nullable().optional(),
    metaDescription: z.string().max(500).nullable().optional(),
    contentHtml: z.string().nullable().optional(),
    status: z
      .enum(["IDEA", "DRAFT", "WAITING_REVIEW", "APPROVED", "ARCHIVED"])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Укажите хотя бы одно поле для обновления.",
  });

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

    const article = await getArticleForUser({ articleId, currentUser });

    return authJsonResponse({ data: article });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { articleId } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = updateArticleSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const article = await updateArticleForUser({
      articleId,
      currentUser,
      data: parsed.data,
    });

    return authJsonResponse({ data: article });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
