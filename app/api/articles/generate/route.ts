import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { generateArticleDraftForWebsite } from "@/lib/articles/generate-article";
import {
  generateArticleFromResearchBrief,
  parseResearchBriefOrThrow,
} from "@/lib/articles/generate-from-research";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import { findPrimaryOrganization } from "@/lib/auth/queries";
import { parseContentResearchBrief } from "@/lib/content-research/parse";
import {
  parsePlanItemsDocument,
} from "@/lib/autopilot/plan-items";

const generateArticleSchema = z
  .object({
    websiteId: z.string().uuid().optional(),
    taskId: z.string().uuid().optional(),
    topic: z.string().min(1).max(500).optional(),
    targetKeyword: z.string().max(200).optional(),
    language: z.enum(["RU", "ET", "EN"]).optional(),
    researchBrief: z.record(z.string(), z.unknown()).optional(),
    planItemId: z.string().min(1).optional(),
    monthlyAutopilotPlanId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.taskId?.trim() ||
          value.topic?.trim() ||
          value.researchBrief ||
          (value.planItemId && value.monthlyAutopilotPlanId)
      ),
    {
      message: "Укажите taskId, topic, researchBrief или planItemId.",
      path: ["topic"],
    }
  );

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

    if (parsed.data.researchBrief) {
      const brief = parseResearchBriefOrThrow(parsed.data.researchBrief);
      const prisma = getPrisma();
      let organizationId = currentUser.organizationId;

      if (!organizationId) {
        const org = await findPrimaryOrganization(prisma, currentUser.id);
        organizationId = org?.id ?? null;
      }

      if (!organizationId) {
        throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
      }

      const result = await generateArticleFromResearchBrief({
        websiteId: brief.websiteId,
        organizationId,
        userId: currentUser.id,
        researchBrief: brief,
        monthlyAutopilotPlanId: parsed.data.monthlyAutopilotPlanId,
        planItemId: parsed.data.planItemId,
        language: parsed.data.language,
      });

      return authJsonResponse({
        data: { article: result.article, qualityReport: result.qualityReport },
      });
    }

    if (parsed.data.planItemId && parsed.data.monthlyAutopilotPlanId) {
      const prisma = getPrisma();
      const plan = await prisma.monthlyAutopilotPlan.findFirst({
        where: {
          id: parsed.data.monthlyAutopilotPlanId,
          userId: currentUser.id,
          archivedAt: null,
        },
      });

      if (!plan) {
        throw new AppError(ErrorCode.NOT_FOUND, "Monthly plan not found");
      }

      const document = plan.planItemsJson
        ? parsePlanItemsDocument(plan.planItemsJson)
        : null;
      const item = document?.items.find((i) => i.id === parsed.data.planItemId);

      if (!item?.researchBrief) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Research brief missing for this plan item."
        );
      }

      const brief = parseContentResearchBrief(item.researchBrief);
      if (!brief) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Research brief is invalid."
        );
      }

      let organizationId = currentUser.organizationId;
      if (!organizationId) {
        const org = await findPrimaryOrganization(prisma, currentUser.id);
        organizationId = org?.id ?? null;
      }

      if (!organizationId) {
        throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
      }

      const result = await generateArticleFromResearchBrief({
        websiteId: plan.websiteId,
        organizationId,
        userId: currentUser.id,
        researchBrief: brief,
        monthlyAutopilotPlanId: plan.id,
        planItemId: item.id,
        language: parsed.data.language,
      });

      return authJsonResponse({
        data: { article: result.article, qualityReport: result.qualityReport },
      });
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
