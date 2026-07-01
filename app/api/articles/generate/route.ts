import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { generateArticleDraftForWebsite } from "@/lib/articles/generate-article";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

const generateArticleSchema = z
  .object({
    websiteId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    topic: z.string().min(1).max(500).optional(),
    targetKeyword: z.string().max(200).optional(),
    language: z.enum(["RU", "ET", "EN"]).optional(),
  })
  .refine((value) => Boolean(value.taskId?.trim() || value.topic?.trim()), {
    message: "Укажите taskId или topic.",
    path: ["topic"],
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

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = generateArticleSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const article = await generateArticleDraftForWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      taskId: parsed.data.taskId,
      topic: parsed.data.topic,
      targetKeyword: parsed.data.targetKeyword,
      language: parsed.data.language,
    });

    return authJsonResponse({ data: { article } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
