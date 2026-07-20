import type { AutopilotPlanItemsDocument } from "@/lib/autopilot/plan-item-types";
import {
  ensureStrategicArticleTopicDepth,
  planItemsToJson,
} from "@/lib/autopilot/plan-items";
import type { MonthlyAutopilotSourceData } from "@/lib/autopilot/source-data";

export function replenishControlCenterArticleTopics(input: {
  document: AutopilotPlanItemsDocument | null;
  sourceData: MonthlyAutopilotSourceData;
  wordpressConnected: boolean;
}): {
  document: AutopilotPlanItemsDocument | null;
  changed: boolean;
  json?: ReturnType<typeof planItemsToJson>;
} {
  if (!input.document) {
    return { document: null, changed: false };
  }

  const replenished = ensureStrategicArticleTopicDepth({
    document: input.document,
    data: input.sourceData,
    articleIntegration: input.wordpressConnected ? "none" : "wordpress",
  });

  if (replenished.addedCount === 0) {
    return { document: input.document, changed: false };
  }

  return {
    document: replenished.document,
    changed: true,
    json: planItemsToJson(replenished.document),
  };
}

