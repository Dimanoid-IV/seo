/**
 * Run with: npx tsx lib/autopilot/plan-view-reconcile.test.ts
 */
import assert from "node:assert/strict";

import { TaskStatus } from "@prisma/client";

import { reconcileMonthlyPlanView } from "./plan-view-reconcile";
import type { MonthlyAutopilotPlanViewModel } from "./types";

function basePlan(
  overrides: Partial<MonthlyAutopilotPlanViewModel> = {}
): MonthlyAutopilotPlanViewModel {
  return {
    id: "plan-1",
    month: "2026-07",
    status: "approved",
    title: "Monthly growth plan — July 2026",
    summary:
      "This month, focus on content and RankBoost found 4 growth opportunities and 2 open tasks to address.",
    metrics: {
      growthScore: 88,
      openTasksCount: 0,
      completedTasksCount: 2,
      opportunitiesCount: 4,
      warningsCount: 0,
      draftArticlesCount: 0,
      readySocialPostsCount: 0,
    },
    focusAreas: [],
    recommendedActions: [],
    risks: [],
    nextSteps: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
    publishingMode: "AUTO_PUBLISH",
    ...overrides,
  };
}

function run(): void {
  const reconciled = reconcileMonthlyPlanView({
    plan: basePlan({
      recommendedActions: [
        {
          id: "legacy-task-action",
          type: "TASK",
          title: "На странице слишком мало текста для продвижения",
          description: "High-priority content task from high queue.",
          priority: "MEDIUM",
          href: "/app",
        },
        {
          id: "action-3",
          type: "REVIEW",
          title: "Опубликовать первую статью",
          description: "Publish first content.",
          priority: "HIGH",
          href: "/app",
        },
        {
          id: "action-2",
          type: "INTEGRATION",
          title: "Connect Google Search Console",
          description: "Unlock search query and page performance insights.",
          priority: "MEDIUM",
          href: "/app/integrations",
        },
      ],
    }),
    tasks: [
      { id: "task-1", status: TaskStatus.COMPLETED },
      { id: "task-2", status: TaskStatus.COMPLETED },
    ],
    readyArticleCount: 2,
    gscPropertySelected: false,
  });

  assert.equal(reconciled.recommendedActions.length, 2);
  assert.equal(reconciled.recommendedActions[0]?.key, "ready_articles_for_publishing");
  assert.equal(reconciled.recommendedActions[0]?.href, "/app/review");
  assert.equal(reconciled.recommendedActions[1]?.title, "Connect Google Search Console");

  const noGscAction = reconcileMonthlyPlanView({
    plan: basePlan({
      recommendedActions: [
        {
          id: "action-2",
          type: "INTEGRATION",
          title: "Connect Google Search Console",
          description: "Unlock search query and page performance insights.",
          priority: "MEDIUM",
          href: "/app/integrations",
        },
      ],
    }),
    tasks: [],
    readyArticleCount: 0,
    gscPropertySelected: true,
  });
  assert.deepEqual(noGscAction.recommendedActions, []);

  const activeTaskPreserved = reconcileMonthlyPlanView({
    plan: basePlan({
      recommendedActions: [
        {
          id: "task-1",
          type: "TASK",
          title: "Fix homepage title",
          description: "Task still open.",
          priority: "HIGH",
          href: "/app/tasks",
        },
      ],
    }),
    tasks: [{ id: "task-1", status: TaskStatus.OPEN }],
    readyArticleCount: 0,
    gscPropertySelected: false,
  });
  assert.equal(activeTaskPreserved.recommendedActions.length, 1);
}

if (require.main === module) {
  run();
  console.log("plan-view-reconcile checks passed");
}

export { run as runPlanViewReconcileChecks };
