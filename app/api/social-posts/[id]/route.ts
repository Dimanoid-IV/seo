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
import { getSocialPostForUser } from "@/lib/social-posts/get-social-posts";
import { updateSocialPost } from "@/lib/social-posts/update-social-post";
import { SocialPostStatus } from "@prisma/client";
import { mapApiPlatformToSocialPlatform } from "@/lib/social-posts/quality";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const updateSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    content: z.string().min(1).max(5000).optional(),
    platform: z
      .enum([
        "LINKEDIN",
        "FACEBOOK",
        "INSTAGRAM",
        "X",
        "GOOGLE_BUSINESS_PROFILE",
        "GENERIC",
      ])
      .optional(),
    status: z
      .enum(["DRAFT", "READY", "COPIED", "APPROVED", "SCHEDULED", "ARCHIVED"])
      .optional(),
    hashtags: z.array(z.string().max(80)).max(12).optional(),
    cta: z.string().max(300).nullable().optional(),
    scheduledFor: z.string().datetime().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;

    const post = await getSocialPostForUser({
      socialPostId: id,
      userId: currentUser.id,
    });

    if (!post) {
      throw new AppError(ErrorCode.NOT_FOUND, "Social post not found");
    }

    return authJsonResponse({ data: post });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const post = await updateSocialPost({
      socialPostId: id,
      userId: currentUser.id,
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        platform: parsed.data.platform
          ? mapApiPlatformToSocialPlatform(parsed.data.platform)
          : undefined,
        status: parsed.data.status as SocialPostStatus | undefined,
        hashtags: parsed.data.hashtags,
        cta: parsed.data.cta,
        scheduledFor: parsed.data.scheduledFor,
      },
    });

    return authJsonResponse({ data: post });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;

    const { archiveSocialPost } = await import(
      "@/lib/social-posts/delete-social-post"
    );

    const post = await archiveSocialPost({
      socialPostId: id,
      userId: currentUser.id,
    });

    return authJsonResponse({ data: post });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
