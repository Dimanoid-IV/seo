import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getReviewQueue } from "@/lib/review-queue/list-review-queue";
import { applyReviewAction } from "@/lib/review-queue/review-actions";
import type { ReviewItemType } from "@/lib/review-queue/types";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const patchSchema = z.object({
  itemType: z.enum([
    "SOCIAL_POST",
    "EMAIL_DRAFT",
    "ARTICLE_DRAFT",
    "SEO_FIX",
    "META_FIX",
    "TASK_FIX",
  ]),
  sourceId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT", "EDIT", "MARK_DONE", "APPLY_TO_SITE"]),
  content: z.string().max(20000).optional(),
});

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const data = await getReviewQueue(currentUser);
    return authJsonResponse({ data });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await applyReviewAction({
      currentUser,
      itemType: parsed.data.itemType as ReviewItemType,
      sourceId: parsed.data.sourceId,
      action: parsed.data.action,
      content: parsed.data.content,
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
