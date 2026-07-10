import "server-only";

import {
  IntegrationProvider,
  IntegrationStatus,
  WebsiteStatus,
} from "@prisma/client";

import { recordUsage } from "@/lib/billing/feature-gates";
import { checkUsageLimit } from "@/lib/billing/usage";
import { getPrisma } from "@/lib/db";
import { safeLogError } from "@/lib/logging";
import {
  generateTaskPreparedFix,
  isHermesConfigured,
} from "@/lib/hermes/client";
import {
  buildHermesSystemInstructions,
  HERMES_REVIEW_CONSTRAINTS,
  hermesLocaleFromSaasLocale,
} from "@/lib/hermes/prompts";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import {
  getWordPressConnection,
  mapWordPressConnectionStatus,
} from "@/lib/integrations/wordpress-connector";
import {
  buildPreparedFixForTask,
  buildPreparedFixFromHermes,
  parseTaskRecommendationWithFix,
} from "@/lib/tasks/prepared-fix";
import type { PreparedFix } from "@/lib/review-queue/types";

type GeneratePreparedFixInput = {
  taskId: string;
  taskTitle: string;
  taskDescription: string | null;
  taskCategory: string;
  taskPriority: string;
  taskSource: string;
  recommendationJson: unknown;
  websiteId: string;
  organizationId: string;
  userId: string;
  locale: SaasLocale;
};

export type GeneratePreparedFixResult = {
  preparedFix: PreparedFix;
  hermesUsed: boolean;
  fallbackUsed: boolean;
  hermesUnavailable: boolean;
};

export async function generatePreparedFixForTask(
  input: GeneratePreparedFixInput
): Promise<GeneratePreparedFixResult> {
  const parsed = parseTaskRecommendationWithFix(input.recommendationJson);
  const hermesConfigured = isHermesConfigured();

  if (!hermesConfigured) {
    return {
      preparedFix: buildPreparedFixForTask({
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        recommendationJson: input.recommendationJson,
        fallbackUsed: true,
      }),
      hermesUsed: false,
      fallbackUsed: true,
      hermesUnavailable: true,
    };
  }

  const usage = await checkUsageLimit({
    userId: input.userId,
    organizationId: input.organizationId,
    key: "AI_GENERATION",
  });

  if (!usage.allowed) {
    return {
      preparedFix: buildPreparedFixForTask({
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        recommendationJson: input.recommendationJson,
        fallbackUsed: true,
      }),
      hermesUsed: false,
      fallbackUsed: true,
      hermesUnavailable: false,
    };
  }

  const prisma = getPrisma();
  const [website, gscIntegration, wordpressConnection] = await Promise.all([
    prisma.website.findFirst({
      where: {
        id: input.websiteId,
        organizationId: input.organizationId,
        deletedAt: null,
        status: WebsiteStatus.ACTIVE,
      },
      select: {
        url: true,
        displayName: true,
        niche: true,
        primaryLanguage: true,
      },
    }),
    prisma.integration.findFirst({
      where: {
        websiteId: input.websiteId,
        provider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
      },
      select: {
        status: true,
        googleData: { select: { searchConsoleSiteUrl: true } },
      },
    }),
    getWordPressConnection({ websiteId: input.websiteId }),
  ]);

  if (!website) {
    return {
      preparedFix: buildPreparedFixForTask({
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        recommendationJson: input.recommendationJson,
        fallbackUsed: true,
      }),
      hermesUsed: false,
      fallbackUsed: true,
      hermesUnavailable: true,
    };
  }

  const hermesLocale = hermesLocaleFromSaasLocale(input.locale);
  const integrations = {
    gscConnected: gscIntegration?.status === IntegrationStatus.CONNECTED,
    gscPropertySelected: Boolean(
      gscIntegration?.googleData?.searchConsoleSiteUrl
    ),
    wordpressConnected: wordpressConnection
      ? mapWordPressConnectionStatus(wordpressConnection.status).connected
      : false,
  };

  try {
    const hermesResult = await generateTaskPreparedFix({
      locale: hermesLocale,
      website: {
        url: website.url,
        name: website.displayName,
        niche: website.niche,
        language: website.primaryLanguage,
      },
      task: {
        id: input.taskId,
        title: input.taskTitle,
        description: input.taskDescription,
        category: input.taskCategory,
        priority: input.taskPriority,
        source: input.taskSource,
        auditCheckCode: parsed.auditCheckCode,
        whyItMatters: parsed.whyItMatters,
        recommendation: parsed.recommendation,
        pageUrl: website.url,
      },
      integrations,
      constraints: HERMES_REVIEW_CONSTRAINTS,
      systemInstructions: buildHermesSystemInstructions(input.locale),
    });

    await recordUsage({
      userId: input.userId,
      organizationId: input.organizationId,
      websiteId: input.websiteId,
      key: "AI_GENERATION",
    });

    return {
      preparedFix: buildPreparedFixFromHermes({
        taskId: input.taskId,
        recommendationJson: input.recommendationJson,
        hermes: hermesResult,
      }),
      hermesUsed: true,
      fallbackUsed: false,
      hermesUnavailable: false,
    };
  } catch (error) {
    safeLogError("review.prepareFix.hermes", error, {
      taskId: input.taskId,
      websiteId: input.websiteId,
    });

    return {
      preparedFix: buildPreparedFixForTask({
        taskId: input.taskId,
        taskTitle: input.taskTitle,
        recommendationJson: input.recommendationJson,
        fallbackUsed: true,
      }),
      hermesUsed: false,
      fallbackUsed: true,
      hermesUnavailable: true,
    };
  }
}
