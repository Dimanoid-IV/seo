import assert from "node:assert/strict";

import { resolveTaskExecutionCapability } from "./execution-capability";
import type { TaskListItem, TaskIntegrationsContext } from "./types";

const integrations: TaskIntegrationsContext = {
  wordpressConnected: true,
  gscConnected: true,
  gscPropertySelected: true,
};

function task(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: "task-1",
    title: "На странице слишком мало текста для продвижения",
    description: "Добавьте описание услуг, преимущества, FAQ и CTA.",
    category: "CONTENT",
    priority: "HIGH",
    status: "OPEN",
    source: "AUDIT",
    impactScore: 80,
    completedAt: null,
    estimatedFixMinutes: 30,
    auditCheckCode: "word_count_low",
    recommendedAction: "Expand on-page content",
    whyItMatters: "Thin pages rank poorly.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

const thinContent = resolveTaskExecutionCapability(task(), integrations);
assert.equal(thinContent.primaryAction, "PREPARE_FIX");
assert.equal(thinContent.simpleHintKey, "pageContentFix");

const contentOpportunity = resolveTaskExecutionCapability(
  task({
    title: "Write guide: SEO audit Tallinn for small businesses",
    auditCheckCode: null,
    source: "MANUAL",
  }),
  integrations
);
assert.equal(contentOpportunity.primaryAction, "CREATE_DRAFT");

const technicalReview = resolveTaskExecutionCapability(
  task({
    title: "Missing meta description on homepage",
    category: "TECHNICAL",
    auditCheckCode: "meta_description_missing",
  }),
  integrations
);
assert.equal(technicalReview.primaryAction, "PREPARE_FIX");

console.log("task execution capability checks passed");
