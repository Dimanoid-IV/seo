import type {
  AutopilotNextStep,
  AutopilotRecommendedAction,
  AutopilotRisk,
  MonthlyAutopilotPlanViewModel,
} from "@/lib/autopilot/types";

import { localizeFocusArea } from "./focus-area-display";
import type { SaasDictionary } from "./types";

type LocalizedCopy = {
  title: string;
  description: string;
};

function replaceParams(
  template: string,
  params: Record<string, string | number> = {}
): string {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}

const LEGACY_ACTION_TITLES: Record<string, string> = {
  "Connect Google Search Console": "connect_gsc",
  "Run a website audit": "run_website_audit",
  "View monthly report": "view_monthly_report",
  "Review social post draft": "review_social_post_draft",
};

const LEGACY_RISK_TITLES: Record<string, string> = {
  "Search Console not connected": "gsc_not_connected",
  "Search Console sync issue": "gsc_sync_issue",
  "Growth Score declined": "growth_score_declined",
  "Many high-priority tasks open": "many_high_priority_tasks",
  "Content drafts waiting for review": "content_drafts_waiting",
  "WordPress connection issue": "wordpress_connection_issue",
  "Limited growth data": "limited_growth_data",
};

const LEGACY_NEXT_STEP_TITLES: Record<string, string> = {
  "Review high-priority tasks": "review_high_priority_tasks",
  "Approve or edit content drafts": "approve_content_drafts",
  "Copy ready social posts": "copy_social_posts",
  "Connect missing integrations": "connect_missing_integrations",
  "Run a new audit": "run_new_audit",
  "Check the timeline": "check_timeline",
};

function resolveActionKey(action: AutopilotRecommendedAction): string | null {
  if (action.key) {
    return action.key;
  }
  if (LEGACY_ACTION_TITLES[action.title]) {
    return LEGACY_ACTION_TITLES[action.title];
  }
  if (action.title.startsWith("Review: ")) {
    return "review_article";
  }
  if (action.title.startsWith("Continue: ")) {
    return "continue_article";
  }
  if (/^High-priority .+ task from .+ queue\.$/.test(action.description)) {
    return "high_priority_task";
  }
  return null;
}

function resolveRiskKey(risk: AutopilotRisk): string | null {
  if (risk.key) {
    return risk.key;
  }
  return LEGACY_RISK_TITLES[risk.title] ?? null;
}

function resolveNextStepKey(step: AutopilotNextStep): string | null {
  if (step.key) {
    return step.key;
  }
  return LEGACY_NEXT_STEP_TITLES[step.title] ?? null;
}

function actionParams(
  action: AutopilotRecommendedAction,
  key: string
): Record<string, string | number> {
  if (action.titleParams || action.descParams) {
    return { ...action.titleParams, ...action.descParams };
  }

  if (key === "review_article" && action.title.startsWith("Review: ")) {
    return { title: action.title.slice("Review: ".length) };
  }
  if (key === "continue_article" && action.title.startsWith("Continue: ")) {
    return { title: action.title.slice("Continue: ".length) };
  }
  if (key === "high_priority_task") {
    const match = /^High-priority (.+) task from (.+) queue\.$/.exec(
      action.description
    );
    if (match) {
      return {
        title: action.title,
        category: match[1],
        priority: match[2],
      };
    }
    return { title: action.title };
  }
  return {};
}

function riskParams(risk: AutopilotRisk, key: string): Record<string, string | number> {
  if (risk.descParams) {
    return risk.descParams;
  }

  if (key === "growth_score_declined") {
    const match = /dropped by (\d+) points/.exec(risk.description);
    if (match) {
      return { delta: match[1] };
    }
  }
  if (key === "many_high_priority_tasks") {
    const match = /^(\d+) high-priority tasks/.exec(risk.description);
    if (match) {
      return { count: match[1] };
    }
  }
  if (key === "content_drafts_waiting") {
    const match = /^(\d+) article draft/.exec(risk.description);
    if (match) {
      return { count: match[1] };
    }
  }
  return {};
}

function getActionCopy(
  key: string,
  params: Record<string, string | number>,
  dict: SaasDictionary
): LocalizedCopy | null {
  const copy = dict.autopilot.planContent.actions[key as keyof typeof dict.autopilot.planContent.actions];
  if (!copy) {
    return null;
  }
  return {
    title: replaceParams(copy.title, params),
    description: replaceParams(copy.description, params),
  };
}

function getRiskCopy(
  key: string,
  params: Record<string, string | number>,
  dict: SaasDictionary,
  fallbackDescription?: string
): LocalizedCopy | null {
  const copy = dict.autopilot.planContent.risks[key as keyof typeof dict.autopilot.planContent.risks];
  if (!copy) {
    return null;
  }
  const description =
    key === "gsc_sync_issue" &&
    fallbackDescription &&
    fallbackDescription !==
      "Google Search Console integration reported an error."
      ? fallbackDescription
      : replaceParams(copy.description, params);
  return {
    title: copy.title,
    description,
  };
}

function getNextStepCopy(
  key: string,
  dict: SaasDictionary
): LocalizedCopy | null {
  const copy =
    dict.autopilot.planContent.nextSteps[key as keyof typeof dict.autopilot.planContent.nextSteps];
  if (!copy) {
    return null;
  }
  return copy;
}

/** Localizes a persisted recommended action by stable key or known legacy English text. */
export function localizeRecommendedAction(
  action: AutopilotRecommendedAction,
  dict: SaasDictionary
): LocalizedCopy {
  const key = resolveActionKey(action);
  if (key) {
    const params = actionParams(action, key);
    const localized = getActionCopy(key, params, dict);
    if (localized) {
      if (key === "high_priority_task") {
        return {
          title: action.title,
          description: localized.description,
        };
      }
      return localized;
    }
  }
  return { title: action.title, description: action.description };
}

/** Localizes a persisted risk by stable key or known legacy English text. */
export function localizeRisk(risk: AutopilotRisk, dict: SaasDictionary): LocalizedCopy {
  const key = resolveRiskKey(risk);
  if (key) {
    const params = riskParams(risk, key);
    const localized = getRiskCopy(key, params, dict, risk.description);
    if (localized) {
      return localized;
    }
  }
  return { title: risk.title, description: risk.description };
}

/** Localizes a persisted next step by stable key or known legacy English text. */
export function localizeNextStep(step: AutopilotNextStep, dict: SaasDictionary): LocalizedCopy {
  const key = resolveNextStepKey(step);
  if (key) {
    const localized = getNextStepCopy(key, dict);
    if (localized) {
      return localized;
    }
  }
  return { title: step.title, description: step.description };
}

export function localizeActionType(
  type: AutopilotRecommendedAction["type"],
  dict: SaasDictionary
): string {
  return dict.autopilot.planContent.actionTypes[type] ?? type;
}

export function localizePlanTitle(
  monthLabel: string,
  storedTitle: string | undefined,
  dict: SaasDictionary
): string {
  if (storedTitle?.startsWith("Monthly growth plan")) {
    return replaceParams(dict.autopilot.planContent.monthlyGrowthPlanTitle, {
      month: monthLabel,
    });
  }
  return storedTitle ?? replaceParams(dict.autopilot.planContent.monthlyGrowthPlanTitle, {
    month: monthLabel,
  });
}

export function localizePlanStatus(
  status: string,
  dict: SaasDictionary
): string {
  const statuses = dict.autopilot.statuses;
  return statuses[status as keyof typeof statuses] ?? status;
}

export function isDeterministicPlanSummary(summary: string): boolean {
  return summary.startsWith("This month,") && summary.includes("RankBoost found");
}

/** Rebuilds the deterministic monthly summary in the active locale from plan data. */
export function buildLocalizedPlanSummary(
  plan: Pick<
    MonthlyAutopilotPlanViewModel,
    "focusAreas" | "metrics" | "summary" | "hermesSummaryUsed"
  >,
  dict: SaasDictionary
): string {
  if (plan.hermesSummaryUsed && plan.summary) {
    return plan.summary;
  }

  if (plan.focusAreas.length === 0 && plan.summary && !isDeterministicPlanSummary(plan.summary)) {
    return plan.summary;
  }

  const s = dict.autopilot.planContent.summary;
  const focusTitles = plan.focusAreas
    .slice(0, 3)
    .map((area) => localizeFocusArea(area, dict).title.toLowerCase());
  const focusPart =
    focusTitles.length > 0
      ? replaceParams(s.focusOn, { areas: focusTitles.join(", ") })
      : s.focusOnDefault;

  const parts = [
    replaceParams(s.intro, { focus: focusPart }),
    plan.metrics.opportunitiesCount === 1
      ? replaceParams(s.opportunitiesOne, { count: plan.metrics.opportunitiesCount })
      : replaceParams(s.opportunitiesMany, { count: plan.metrics.opportunitiesCount }),
  ];

  const reviewCount =
    plan.metrics.draftArticlesCount + plan.metrics.readySocialPostsCount;
  if (reviewCount > 0) {
    parts.push(
      reviewCount === 1
        ? replaceParams(s.waitingReviewOne, { count: reviewCount })
        : replaceParams(s.waitingReviewMany, { count: reviewCount })
    );
  }

  if (plan.metrics.openTasksCount > 0) {
    parts.push(
      plan.metrics.openTasksCount === 1
        ? replaceParams(s.openTasksOne, { count: plan.metrics.openTasksCount })
        : replaceParams(s.openTasksMany, { count: plan.metrics.openTasksCount })
    );
  }

  return `${parts.join(s.joiner)}.`;
}

/** Short localized summary for control-center snippets when full plan data is unavailable. */
export function localizePlanSummarySnippet(
  summary: string | undefined,
  dict: SaasDictionary
): string | undefined {
  if (!summary) {
    return undefined;
  }
  if (isDeterministicPlanSummary(summary)) {
    return dict.autopilot.planContent.summaryTeaser;
  }
  return summary;
}
