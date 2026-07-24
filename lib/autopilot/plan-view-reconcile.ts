import { TaskStatus } from "@prisma/client";

import type {
  AutopilotRecommendedAction,
  MonthlyAutopilotPlanViewModel,
} from "./types";

export type ReconcilePlanTaskRow = {
  id: string;
  status: TaskStatus;
};

type ReconcileMonthlyPlanViewInput = {
  plan: MonthlyAutopilotPlanViewModel;
  tasks: ReconcilePlanTaskRow[];
  readyArticleCount: number;
  gscPropertySelected: boolean;
};

function isActiveTaskStatus(status: TaskStatus): boolean {
  return status === TaskStatus.OPEN || status === TaskStatus.IN_PROGRESS;
}

function isPlaceholderFirstArticleAction(action: AutopilotRecommendedAction): boolean {
  return (
    action.type === "REVIEW" &&
    ["Опубликовать первую статью", "Publish first article", "Publish the first article"].includes(
      action.title.trim()
    )
  );
}

function actionStillRelevant(
  action: AutopilotRecommendedAction,
  input: ReconcileMonthlyPlanViewInput
): boolean {
  if (isPlaceholderFirstArticleAction(action)) {
    return false;
  }

  if (action.type === "TASK") {
    const matchingTask = input.tasks.find((task) => task.id === action.id);
    if (matchingTask) {
      return isActiveTaskStatus(matchingTask.status);
    }

    // Legacy task actions often stored the task title but not the task ID.
    // If there are no active tasks left, do not keep stale task prompts around.
    return input.tasks.some((task) => isActiveTaskStatus(task.status));
  }

  if (action.key === "connect_gsc" || action.title === "Connect Google Search Console") {
    return !input.gscPropertySelected;
  }

  return true;
}

function readyArticlesAction(count: number): AutopilotRecommendedAction {
  return {
    id: "ready-articles-for-publishing",
    type: "REVIEW",
    priority: "HIGH",
    href: "/app/review",
    title: "Ready articles",
    description: `${count} article draft(s) are ready to publish.`,
    key: "ready_articles_for_publishing",
    titleParams: { count },
    descParams: { count },
  };
}

/**
 * Returns a read-time view-model copy of an existing plan with stale actions
 * removed and real next actions promoted. This does not mutate the historical
 * plan snapshot; it only prevents old data from confusing the current UI.
 */
export function reconcileMonthlyPlanView(
  input: ReconcileMonthlyPlanViewInput
): MonthlyAutopilotPlanViewModel {
  const recommendedActions = input.plan.recommendedActions.filter((action) =>
    actionStillRelevant(action, input)
  );

  if (
    input.readyArticleCount > 0 &&
    !recommendedActions.some((action) => action.key === "ready_articles_for_publishing")
  ) {
    recommendedActions.unshift(readyArticlesAction(input.readyArticleCount));
  }

  return {
    ...input.plan,
    recommendedActions,
  };
}
