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
import { generateSocialPostDraftForWebsite } from "@/lib/social-posts/generate-social-post";
import { SocialPostSource } from "@prisma/client";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const generateSchema = z.object({
  websiteId: z.string().uuid().optional(),
  platform: z.enum([
    "LINKEDIN",
    "FACEBOOK",
    "INSTAGRAM",
    "X",
    "GOOGLE_BUSINESS_PROFILE",
    "GENERIC",
  ]),
  source: z.nativeEnum(SocialPostSource).refine(
    (value) => value !== SocialPostSource.MANUAL,
    "Use POST /api/social-posts for manual drafts."
  ),
  sourceId: z.string().optional(),
  language: z.enum(["RU", "ET", "EN"]).optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const post = await generateSocialPostDraftForWebsite({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      platform: parsed.data.platform,
      source: parsed.data.source,
      sourceId: parsed.data.sourceId,
      language: parsed.data.language,
    });

    return authJsonResponse({ data: post });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
