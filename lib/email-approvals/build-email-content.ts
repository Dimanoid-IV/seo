import {
  EmailApprovalType,
} from "@prisma/client";

import type { EmailApprovalSourceData } from "./source-data";
import { appLink, formatAutopilotMonthLabel } from "./app-links";

function formatScoreDelta(delta: number | null): string {
  if (delta == null) {
    return "";
  }
  const sign = delta > 0 ? "+" : "";
  return ` (${sign}${delta})`;
}

function footer(): string {
  return [
    "",
    "Nothing will be published or sent automatically. You stay in control.",
    "",
    "RankBoost",
  ].join("\n");
}

export function buildEmailContent(
  type: EmailApprovalType,
  data: EmailApprovalSourceData
): { subject: string; body: string } {
  switch (type) {
    case EmailApprovalType.MONTHLY_PLAN_REVIEW:
      return buildMonthlyPlanReviewEmail(data);
    case EmailApprovalType.CONTENT_REVIEW:
      return buildContentReviewEmail(data);
    case EmailApprovalType.SOCIAL_POST_REVIEW:
      return buildSocialPostReviewEmail(data);
    case EmailApprovalType.GROWTH_ALERT:
      return buildGrowthAlertEmail(data);
    case EmailApprovalType.INTEGRATION_ALERT:
      return buildIntegrationAlertEmail(data);
    case EmailApprovalType.GENERAL_REVIEW:
    default:
      return buildGeneralReviewEmail(data);
  }
}

function buildMonthlyPlanReviewEmail(data: EmailApprovalSourceData) {
  const plan = data.monthlyPlan;
  if (!plan) {
    throw new Error("Monthly plan required");
  }

  const monthLabel = formatAutopilotMonthLabel(plan.month);
  const metrics = plan.metrics;
  const scoreLine =
    metrics.growthScore != null
      ? `- Growth Score: ${metrics.growthScore}${formatScoreDelta(metrics.growthScoreDelta ?? null)}`
      : null;

  const metricsLines = [
    scoreLine,
    `- Open tasks: ${metrics.openTasksCount}`,
    `- New opportunities: ${metrics.opportunitiesCount}`,
    `- Ready social posts: ${metrics.readySocialPostsCount}`,
    `- Draft articles: ${metrics.draftArticlesCount}`,
  ].filter(Boolean);

  const focusLines = plan.focusAreas.slice(0, 5).map((area, index) => {
    return `${index + 1}. ${area.title}\n   ${area.description}`;
  });

  const nextStepLines = plan.nextSteps.slice(0, 4).map((step) => `- ${step.title}`);

  const body = [
    "Hi,",
    "",
    `RankBoost prepared your monthly growth plan for ${monthLabel}.`,
    "",
    "Summary:",
    plan.summary || "Review your monthly priorities and recommended actions.",
    "",
    "Key metrics:",
    ...metricsLines,
    "",
    focusLines.length ? "Recommended focus areas:" : "",
    ...focusLines,
    "",
    nextStepLines.length ? "Next steps:" : "",
    ...nextStepLines,
    "",
    appLink("/autopilot", "Open Monthly Autopilot"),
    appLink("/", "Review high-priority tasks"),
    appLink("/content-plan", "Review article drafts"),
    appLink("/social-posts", "Review social posts"),
    footer(),
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: `Your ${monthLabel} growth plan is ready for review`,
    body,
  };
}

function buildContentReviewEmail(data: EmailApprovalSourceData) {
  const waitingReview = data.articles.filter(
    (a) => a.status === "WAITING_REVIEW"
  );
  const drafts = data.articles.filter(
    (a) => a.status === "DRAFT" || a.status === "IDEA"
  );
  const wpDrafts = data.articles.filter(
    (a) => a.status === "WORDPRESS_DRAFT_CREATED"
  );

  const lines = data.articles.slice(0, 8).map((a) => `- ${a.title} (${a.status})`);

  const body = [
    "Hi,",
    "",
    "New article drafts are ready for your review.",
    "",
    waitingReview.length
      ? `${waitingReview.length} article(s) waiting for review.`
      : "",
    drafts.length ? `${drafts.length} draft(s) in progress.` : "",
    wpDrafts.length
      ? `${wpDrafts.length} WordPress draft(s) created and awaiting review.`
      : "",
    "",
    "Articles:",
    ...lines,
    "",
    appLink("/content-plan", "Open Content Plan"),
    ...data.articles.slice(0, 3).map((a) =>
      appLink(`/articles/${a.id}`, `Review: ${a.title}`)
    ),
    footer(),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: "Article drafts are ready for review",
    body,
  };
}

function buildSocialPostReviewEmail(data: EmailApprovalSourceData) {
  const ready = data.socialPosts.filter((p) => p.status === "READY");
  const lines = data.socialPosts.slice(0, 8).map(
    (p) =>
      `- ${p.title ?? "Social post draft"} (${p.platform}, ${p.status})`
  );

  const body = [
    "Hi,",
    "",
    "Social post drafts are ready to review or copy.",
    "",
    ready.length
      ? `${ready.length} post(s) marked ready for review.`
      : "Review draft social posts before sharing.",
    "",
    "Posts:",
    ...lines,
    "",
    appLink("/social-posts", "Review social posts"),
    footer(),
  ].join("\n");

  return {
    subject: "Social post drafts are ready for review",
    body,
  };
}

function buildGrowthAlertEmail(data: EmailApprovalSourceData) {
  const highTasks = data.tasks.filter(
    (t) => t.priority === "CRITICAL" || t.priority === "HIGH"
  );
  const warnings = data.timelineEvents.filter(
    (e) => e.severity === "WARNING" || e.severity === "ERROR"
  );

  const scoreLine =
    data.growthScore.latest != null
      ? `Growth Score: ${data.growthScore.latest}${formatScoreDelta(data.growthScore.delta)}`
      : null;

  const body = [
    "Hi,",
    "",
    "RankBoost found important website growth changes that need your attention.",
    "",
    scoreLine ?? "",
    highTasks.length
      ? `${highTasks.length} high-priority task(s) are open.`
      : "",
    warnings.length
      ? `${warnings.length} recent warning(s) on your timeline.`
      : "",
    "",
    highTasks.length ? "High-priority tasks:" : "",
    ...highTasks.slice(0, 5).map((t) => `- ${t.title}`),
    "",
    warnings.length ? "Recent warnings:" : "",
    ...warnings.slice(0, 3).map((e) => `- ${e.title}`),
    "",
    appLink("/", "Open dashboard"),
    appLink("/timeline", "Open Timeline"),
    footer(),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: "Important growth changes need your attention",
    body,
  };
}

function buildIntegrationAlertEmail(data: EmailApprovalSourceData) {
  const issues: string[] = [];

  if (!data.integrations.gscConnected) {
    issues.push("- Google Search Console is not connected.");
  }
  if (data.integrations.gscError) {
    issues.push(
      `- Search Console sync issue${data.integrations.gscErrorMessage ? `: ${data.integrations.gscErrorMessage}` : "."}`
    );
  }
  if (!data.integrations.wordpressConnected) {
    issues.push("- WordPress is not connected.");
  }
  if (data.integrations.wordpressError) {
    issues.push("- WordPress connection needs attention.");
  }

  const body = [
    "Hi,",
    "",
    "An integration needs your attention.",
    "",
    ...issues,
    "",
    appLink("/integrations", "Connect integrations"),
    footer(),
  ].join("\n");

  return {
    subject: "An integration needs your attention",
    body,
  };
}

function buildGeneralReviewEmail(data: EmailApprovalSourceData) {
  const pendingItems: string[] = [];

  if (data.monthlyPlan) {
    pendingItems.push(
      `- Monthly plan for ${formatAutopilotMonthLabel(data.monthlyPlan.month)} is ready for review.`
    );
  }
  if (data.articles.length) {
    pendingItems.push(`- ${data.articles.length} article draft(s) need attention.`);
  }
  if (data.socialPosts.length) {
    pendingItems.push(`- ${data.socialPosts.length} social post draft(s) available.`);
  }
  if (data.tasks.length) {
    pendingItems.push(`- ${data.tasks.length} open task(s).`);
  }
  if (data.timelineEvents.length) {
    pendingItems.push(`- ${data.timelineEvents.length} recent timeline event(s).`);
  }

  const body = [
    "Hi,",
    "",
    "Here is what needs your attention:",
    "",
    ...pendingItems,
    "",
    data.timelineEvents.length
      ? "Recent activity:"
      : "",
    ...data.timelineEvents.slice(0, 5).map((e) => `- ${e.title}`),
    "",
    appLink("/autopilot", "Open Monthly Autopilot"),
    appLink("/", "Review tasks"),
    appLink("/content-plan", "Review article drafts"),
    appLink("/social-posts", "Review social posts"),
    appLink("/timeline", "Open Timeline"),
    footer(),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: "Items waiting for your review",
    body,
  };
}
