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
import {
  createSocialPost,
  resolveWebsiteForSocialPosts,
} from "@/lib/social-posts/create-social-post";
import { getSocialPosts } from "@/lib/social-posts/get-social-posts";
import {
  mapApiPlatformToSocialPlatform,
  validateSocialPostQuality,
} from "@/lib/social-posts/quality";
import {
  SocialPlatform,
  SocialPostSource,
  SocialPostStatus,
  WebsiteLanguage,
} from "@prisma/client";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const platformSchema = z.enum([
  "LINKEDIN",
  "FACEBOOK",
  "INSTAGRAM",
  "X",
  "GOOGLE_BUSINESS_PROFILE",
  "GENERIC",
]);

const createSchema = z.object({
  websiteId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  content: z.string().min(1).max(5000),
  platform: platformSchema,
  language: z.enum(["RU", "ET", "EN"]).optional(),
  hashtags: z.array(z.string().max(80)).max(12).optional(),
  cta: z.string().max(300).optional(),
});

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);

    const result = await getSocialPosts({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: url.searchParams.get("websiteId") ?? undefined,
      limit: url.searchParams.get("limit")
        ? Number.parseInt(url.searchParams.get("limit") ?? "20", 10)
        : undefined,
      cursor: url.searchParams.get("cursor"),
      ...(url.searchParams.get("status")
        ? { status: url.searchParams.get("status") as SocialPostStatus }
        : {}),
      ...(url.searchParams.get("platform")
        ? { platform: url.searchParams.get("platform") as SocialPlatform }
        : {}),
      ...(url.searchParams.get("source")
        ? { source: url.searchParams.get("source") as SocialPostSource }
        : {}),
      includeArchived: url.searchParams.get("includeArchived") === "true",
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const { organization, website } = await resolveWebsiteForSocialPosts(
      currentUser.id,
      currentUser.organizationId,
      parsed.data.websiteId
    );

    const platform = mapApiPlatformToSocialPlatform(parsed.data.platform);
    const language =
      parsed.data.language ?? website.primaryLanguage ?? WebsiteLanguage.EN;

    const quality = validateSocialPostQuality({
      title: parsed.data.title,
      text: parsed.data.content,
      platform,
      language,
      cta: parsed.data.cta,
      hashtags: parsed.data.hashtags,
    });

    const post = await createSocialPost({
      userId: currentUser.id,
      websiteId: website.id,
      organizationId: organization.id,
      title: parsed.data.title,
      content: parsed.data.content,
      platform,
      language,
      source: SocialPostSource.MANUAL,
      hashtags: parsed.data.hashtags,
      cta: parsed.data.cta,
      qualityScore: quality.qualityScore,
      qualityIssues: quality.issues,
      status: quality.passed ? SocialPostStatus.READY : SocialPostStatus.DRAFT,
    });

    return authJsonResponse({ data: post });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
