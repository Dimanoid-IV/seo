import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { generateEmailApprovalDraft } from "@/lib/email-approvals/generate-email-approval";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

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
  type: z.enum([
    "MONTHLY_PLAN_REVIEW",
    "CONTENT_REVIEW",
    "SOCIAL_POST_REVIEW",
    "GROWTH_ALERT",
    "INTEGRATION_ALERT",
    "GENERAL_REVIEW",
  ]),
  source: z.enum([
    "MONTHLY_AUTOPILOT",
    "ARTICLE",
    "SOCIAL_POST",
    "TIMELINE",
    "GSC",
    "INTEGRATION",
    "MANUAL",
    "SYSTEM",
  ]),
  sourceId: z.string().uuid().optional(),
  websiteId: z.string().uuid().optional(),
  language: z.string().max(10).optional(),
  recipientEmail: z.string().email().optional(),
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

    const email = await generateEmailApprovalDraft({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      type: parsed.data.type,
      source: parsed.data.source,
      sourceId: parsed.data.sourceId,
      language: parsed.data.language,
      recipientEmail: parsed.data.recipientEmail,
    });

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
