import "server-only";

import { AuditStatus, AuditTriggeredBy, WebsiteStatus } from "@prisma/client";

import { runAndPersistWebsiteAudit } from "@/lib/audit/persist-audit";
import { fetchHtmlPage } from "@/lib/audit/fetch";
import {
  extractBrandVoiceFromWebsite,
} from "@/lib/brand-voice/extract-brand-voice";
import {
  readBrandVoiceFromBusinessGoals,
  saveWebsiteBrandVoice,
} from "@/lib/brand-voice/persist";
import { generateMonthlyAutopilotPlan } from "@/lib/autopilot/generate-monthly-plan";
import { getPrisma } from "@/lib/db";
import { syncGrowthOpportunitiesForWebsite } from "@/lib/growth/sync-opportunities";
import { detectSiteTech } from "@/lib/site-tech/detect-site-tech";

import {
  decideAuditStep,
  decideBrandVoiceStep,
  decideMonthlyPlanStep,
  decideSiteTechStep,
  deriveOverallStatus,
  mergeStep,
  normalizeNeedsActionDecision,
  type ActivationFacts,
} from "./activation-decisions";
import {
  getActivationStateForUser,
  saveActivationState,
} from "./activation-state";
import type { ActivationState, ActivationStepKey } from "./activation-types";
import {
  readSiteTechFromBusinessGoals,
  siteTechAsInputJson,
} from "./site-tech-persist";

export type RunActivationPipelineInput = {
  userId: string;
  organizationId: string;
  websiteId: string;
  websiteUrl: string;
  locale?: string;
  /** When true, re-run failed / needs_action steps only (or all missing). */
  retry?: boolean;
};

export type ActivationPipelineSummary = {
  activation: ActivationState;
  articleDraftsGenerated: number;
  brandVoiceExtracted: boolean;
  siteTechPlatform: string | null;
  auditId: string | null;
  monthlyPlanId: string | null;
  planBlockedReason: string | null;
};

async function loadFacts(websiteId: string): Promise<ActivationFacts> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: { id: websiteId, deletedAt: null },
    select: { businessGoals: true },
  });

  const brandVoice = readBrandVoiceFromBusinessGoals(website?.businessGoals);
  const siteTech = readSiteTechFromBusinessGoals(website?.businessGoals);

  const completedAudit = await prisma.audit.findFirst({
    where: {
      websiteId,
      status: AuditStatus.COMPLETED,
      deletedAt: null,
    },
    select: { id: true },
  });

  const now = new Date();
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const monthlyPlan = await prisma.monthlyAutopilotPlan.findUnique({
    where: {
      websiteId_month: { websiteId, month },
    },
    select: { id: true },
  });

  const articleDraftCount = await prisma.article.count({
    where: { websiteId, deletedAt: null },
  });

  return {
    hasStoredSiteTech: Boolean(siteTech),
    hasStoredBrandVoice: Boolean(brandVoice),
    brandVoiceManuallyEdited: Boolean(brandVoice?.manuallyEdited),
    hasCompletedAudit: Boolean(completedAudit),
    hasMonthlyPlan: Boolean(monthlyPlan),
    articleDraftCount,
  };
}

function shouldRunStep(
  key: ActivationStepKey,
  state: ActivationState | null,
  retry: boolean
): boolean {
  if (!retry) return true;
  if (!state) return true;
  const status = state.steps[key]?.status;
  return (
    !status ||
    status === "failed" ||
    status === "needs_action" ||
    status === "pending" ||
    status === "in_progress"
  );
}

/**
 * Idempotent first-website activation.
 * Never generates paid article drafts. Safe to call repeatedly.
 */
export async function runActivationPipeline(
  input: RunActivationPipelineInput
): Promise<ActivationPipelineSummary> {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      organizationId: input.organizationId,
      deletedAt: null,
      status: WebsiteStatus.ACTIVE,
    },
    select: {
      id: true,
      url: true,
      primaryLanguage: true,
      businessGoals: true,
    },
  });

  if (!website) {
    throw new Error("Website not found for activation");
  }

  let activation =
    (await getActivationStateForUser(input.userId)) ??
    ({
      status: "running",
      version: 1,
      websiteId: website.id,
      startedAt: new Date().toISOString(),
      steps: {},
    } satisfies ActivationState);

  if (activation.websiteId !== website.id) {
    activation = {
      status: "running",
      version: 1,
      websiteId: website.id,
      startedAt: new Date().toISOString(),
      steps: {},
    };
  }

  activation = {
    ...activation,
    status: "running",
    startedAt: activation.startedAt ?? new Date().toISOString(),
    finishedAt: undefined,
    lastError: undefined,
  };
  await saveActivationState({ userId: input.userId, activation });

  const facts = await loadFacts(website.id);
  let brandVoiceExtracted = facts.hasStoredBrandVoice;
  let siteTechPlatform: string | null = null;
  let auditId: string | null = null;
  let monthlyPlanId: string | null = null;
  let planBlockedReason: string | null = null;
  const articleDraftsGenerated = 0;

  const existingTech = readSiteTechFromBusinessGoals(website.businessGoals);
  if (existingTech) {
    siteTechPlatform = existingTech.platform;
  }

  // --- 1. Site technology ---
  if (shouldRunStep("siteTech", activation, Boolean(input.retry))) {
    const decision = decideSiteTechStep(facts);
    if (decision.action === "skip") {
      activation = mergeStep(activation, website.id, "siteTech", {
        status: "done",
        detail: decision.reason,
        resultRef: siteTechPlatform ?? undefined,
      });
    } else {
      activation = mergeStep(activation, website.id, "siteTech", {
        status: "in_progress",
      });
      await saveActivationState({ userId: input.userId, activation });

      try {
        const page = await fetchHtmlPage(website.url, 10_000);
        const detection = detectSiteTech({
          html: page.html,
          headers: page.headers,
          url: page.finalUrl,
        });
        const nextGoals = siteTechAsInputJson(
          website.businessGoals,
          detection
        );
        await prisma.website.update({
          where: { id: website.id },
          data: {
            businessGoals: nextGoals,
          },
        });
        website.businessGoals = nextGoals as typeof website.businessGoals;
        siteTechPlatform = detection.platform;
        activation = mergeStep(activation, website.id, "siteTech", {
          status: "done",
          resultRef: detection.platform,
          detail: `confidence:${detection.confidence.toFixed(2)}`,
        });
      } catch (error) {
        activation = mergeStep(activation, website.id, "siteTech", {
          status: "failed",
          error: error instanceof Error ? error.message : "site_tech_failed",
        });
      }
    }
    await saveActivationState({ userId: input.userId, activation });
  }

  // --- 2. Brand voice ---
  if (shouldRunStep("brandVoice", activation, Boolean(input.retry))) {
    const refreshedFacts = await loadFacts(website.id);
    const decision = decideBrandVoiceStep(refreshedFacts);
    if (decision.action === "skip") {
      activation = mergeStep(activation, website.id, "brandVoice", {
        status: "done",
        detail: decision.reason,
      });
      brandVoiceExtracted = true;
    } else {
      activation = mergeStep(activation, website.id, "brandVoice", {
        status: "in_progress",
      });
      await saveActivationState({ userId: input.userId, activation });

      try {
        const profile = await extractBrandVoiceFromWebsite({
          websiteUrl: website.url,
          language: website.primaryLanguage.toLowerCase(),
        });
        await saveWebsiteBrandVoice({
          websiteId: website.id,
          organizationId: input.organizationId,
          profile,
        });
        brandVoiceExtracted = true;
        activation = mergeStep(activation, website.id, "brandVoice", {
          status: "done",
          detail: `confidence:${profile.confidence}`,
          resultRef: profile.tone,
        });
      } catch (error) {
        activation = mergeStep(activation, website.id, "brandVoice", {
          status: "failed",
          error: error instanceof Error ? error.message : "brand_voice_failed",
        });
      }
    }
    await saveActivationState({ userId: input.userId, activation });
  }

  // --- 3. Audit ---
  if (shouldRunStep("audit", activation, Boolean(input.retry))) {
    const refreshedFacts = await loadFacts(website.id);
    const decision = decideAuditStep(refreshedFacts);
    if (decision.action === "skip") {
      const existing = await prisma.audit.findFirst({
        where: {
          websiteId: website.id,
          status: AuditStatus.COMPLETED,
          deletedAt: null,
        },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });
      auditId = existing?.id ?? null;
      activation = mergeStep(activation, website.id, "audit", {
        status: "done",
        detail: decision.reason,
        resultRef: auditId ?? undefined,
      });
    } else {
      activation = mergeStep(activation, website.id, "audit", {
        status: "in_progress",
      });
      await saveActivationState({ userId: input.userId, activation });

      try {
        const result = await runAndPersistWebsiteAudit({
          websiteId: website.id,
          userId: input.userId,
          trigger: AuditTriggeredBy.ONBOARDING,
        });
        auditId = result.auditId;
        activation = mergeStep(activation, website.id, "audit", {
          status: "done",
          resultRef: result.auditId,
          detail: `score:${result.score}`,
        });
      } catch (error) {
        activation = mergeStep(activation, website.id, "audit", {
          status: "needs_action",
          error: error instanceof Error ? error.message : "audit_failed",
          detail: "manual_audit_needed",
        });
      }
    }
    await saveActivationState({ userId: input.userId, activation });
  }

  // --- 4. Growth opportunities (idempotent sync) ---
  if (shouldRunStep("growth", activation, Boolean(input.retry))) {
    activation = mergeStep(activation, website.id, "growth", {
      status: "in_progress",
    });
    await saveActivationState({ userId: input.userId, activation });
    try {
      await syncGrowthOpportunitiesForWebsite({
        userId: input.userId,
        websiteId: website.id,
        organizationId: input.organizationId,
      });
      activation = mergeStep(activation, website.id, "growth", {
        status: "done",
      });
    } catch (error) {
      activation = mergeStep(activation, website.id, "growth", {
        status: "failed",
        error: error instanceof Error ? error.message : "growth_sync_failed",
      });
    }
    await saveActivationState({ userId: input.userId, activation });
  }

  // --- 5/6. Topics + monthly plan draft (no article generation) ---
  if (
    shouldRunStep("monthlyPlan", activation, Boolean(input.retry)) ||
    shouldRunStep("topics", activation, Boolean(input.retry))
  ) {
    const refreshedFacts = await loadFacts(website.id);
    const decision = normalizeNeedsActionDecision(
      decideMonthlyPlanStep(refreshedFacts)
    );

    if (decision.action === "skip") {
      planBlockedReason =
        decision.reason === "needs_audit"
          ? "needs_audit"
          : decision.reason ?? null;
      activation = mergeStep(activation, website.id, "topics", {
        status: decision.status ?? "skipped",
        detail: decision.reason,
      });
      activation = mergeStep(activation, website.id, "monthlyPlan", {
        status: decision.status ?? "skipped",
        detail: decision.reason,
      });
      if (decision.reason === "plan_exists") {
        const now = new Date();
        const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
        const existing = await prisma.monthlyAutopilotPlan.findUnique({
          where: {
            websiteId_month: { websiteId: website.id, month },
          },
          select: { id: true },
        });
        monthlyPlanId = existing?.id ?? null;
        activation = mergeStep(activation, website.id, "topics", {
          status: "done",
          detail: "plan_exists",
        });
        activation = mergeStep(activation, website.id, "monthlyPlan", {
          status: "done",
          resultRef: monthlyPlanId ?? undefined,
        });
        planBlockedReason = null;
      }
    } else {
      activation = mergeStep(activation, website.id, "topics", {
        status: "in_progress",
      });
      activation = mergeStep(activation, website.id, "monthlyPlan", {
        status: "in_progress",
      });
      await saveActivationState({ userId: input.userId, activation });

      try {
        const { plan, created } = await generateMonthlyAutopilotPlan({
          userId: input.userId,
          organizationId: input.organizationId,
          websiteId: website.id,
          forceRegenerate: false,
        });
        monthlyPlanId = plan.id;
        const articleTopicCount =
          plan.planItems?.items?.filter((i) => i.type === "ARTICLE").length ??
          plan.recommendedActions?.filter((a) => a.type === "ARTICLE").length ??
          0;

        activation = mergeStep(activation, website.id, "topics", {
          status: "done",
          detail: `article_topics:${articleTopicCount}`,
        });
        activation = mergeStep(activation, website.id, "monthlyPlan", {
          status: "done",
          resultRef: plan.id,
          detail: created ? "created" : "existing",
        });
      } catch (error) {
        activation = mergeStep(activation, website.id, "topics", {
          status: "failed",
          error: error instanceof Error ? error.message : "topics_failed",
        });
        activation = mergeStep(activation, website.id, "monthlyPlan", {
          status: "failed",
          error: error instanceof Error ? error.message : "plan_failed",
        });
      }
    }
  }

  activation = {
    ...activation,
    status: deriveOverallStatus(activation.steps),
    finishedAt: new Date().toISOString(),
    planBlockedReason: planBlockedReason ?? undefined,
  };
  await saveActivationState({ userId: input.userId, activation });

  return {
    activation,
    articleDraftsGenerated,
    brandVoiceExtracted,
    siteTechPlatform,
    auditId,
    monthlyPlanId,
    planBlockedReason,
  };
}

/**
 * Mark activation as running synchronously, then caller schedules pipeline via after().
 */
export async function markActivationStarted(input: {
  userId: string;
  websiteId: string;
}): Promise<ActivationState> {
  const activation: ActivationState = {
    status: "running",
    version: 1,
    websiteId: input.websiteId,
    startedAt: new Date().toISOString(),
    steps: {
      siteTech: { status: "pending" },
      brandVoice: { status: "pending" },
      audit: { status: "pending" },
      growth: { status: "pending" },
      topics: { status: "pending" },
      monthlyPlan: { status: "pending" },
    },
  };
  return saveActivationState({ userId: input.userId, activation });
}

/**
 * Schedule-safe wrapper: never throws to the HTTP layer.
 */
export async function runActivationPipelineSafe(
  input: RunActivationPipelineInput
): Promise<ActivationPipelineSummary | null> {
  try {
    return await runActivationPipeline(input);
  } catch (error) {
    try {
      const current = await getActivationStateForUser(input.userId);
      await saveActivationState({
        userId: input.userId,
        activation: {
          status: "failed",
          version: 1,
          websiteId: input.websiteId,
          startedAt: current?.startedAt ?? new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          steps: current?.steps ?? {},
          lastError:
            error instanceof Error ? error.message : "activation_failed",
        },
      });
    } catch {
      // ignore secondary persistence failures
    }
    return null;
  }
}
