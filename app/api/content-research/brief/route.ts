import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { resolveWebsiteForAutopilot } from "@/lib/autopilot/resolve-website";
import { generateContentResearchBrief } from "@/lib/content-research/generate-brief";
import { toResearchBriefSummary } from "@/lib/content-research/types";
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

const postSchema = z.object({
  websiteId: z.string().uuid().optional(),
  source: z
    .enum(["MANUAL_ARTICLE", "TASK", "GSC", "AUDIT", "AUTOPILOT_PLAN"])
    .default("MANUAL_ARTICLE"),
  topic: z.string().max(500).optional(),
  targetKeyword: z.string().max(200).optional(),
  taskId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const { organization, website } = await resolveWebsiteForAutopilot(
      currentUser.id,
      currentUser.organizationId,
      parsed.data.websiteId
    );

    const brief = await generateContentResearchBrief({
      websiteId: website.id,
      organizationId: organization.id,
      userId: currentUser.id,
      source: parsed.data.source,
      manualTopic: parsed.data.topic,
      manualKeyword: parsed.data.targetKeyword,
      taskId: parsed.data.taskId,
      articleId: parsed.data.articleId,
    });

    return authJsonResponse({
      data: {
        brief,
        summary: toResearchBriefSummary(brief),
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
