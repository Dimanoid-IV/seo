import { z } from "zod";

import { generateRecommendationsForWebsite } from "@/lib/ai/generate-recommendations";
import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getLocaleFromRequest } from "@/lib/i18n/saas/server-locale";

const generateRecommendationsSchema = z.object({
  type: z.enum(["seo_tasks", "content_brief", "monthly_plan"]),
  websiteId: z.string().uuid().optional(),
});

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured. Set DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = generateRecommendationsSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const locale = getLocaleFromRequest(request);
    const result = await generateRecommendationsForWebsite({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      type: parsed.data.type,
      locale,
    });

    return authJsonResponse({ data: { recommendation: result } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
