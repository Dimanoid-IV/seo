import "server-only";

import type { AutopilotPlanItem } from "@/lib/autopilot/plan-item-types";

import { generateContentResearchBrief } from "./generate-brief";
import type { ContentResearchBrief } from "./types";
import { briefToJson } from "./parse";

/**
 * Attaches research briefs to ARTICLE plan items (deterministic, in-memory).
 */
export async function attachResearchBriefsToPlanItems(input: {
  items: AutopilotPlanItem[];
  websiteId: string;
  organizationId: string;
  userId: string;
  focusAreaTitles?: string[];
}): Promise<AutopilotPlanItem[]> {
  const articleItems = input.items.filter((item) => item.type === "ARTICLE");
  if (articleItems.length === 0) {
    return input.items;
  }

  const { loadResearchSourceContext } = await import("./source-context");
  const context = await loadResearchSourceContext({
    websiteId: input.websiteId,
    organizationId: input.organizationId,
    userId: input.userId,
    focusAreaTitles: input.focusAreaTitles,
  });

  const briefByItemId = new Map<string, ContentResearchBrief>();

  for (const item of articleItems) {
    const brief = await generateContentResearchBrief({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      userId: input.userId,
      source: "AUTOPILOT_PLAN",
      briefId: `research-${item.id}`,
      planItemTitle: item.title,
      planItemReason: item.reason,
      taskId:
        item.sourceRef?.type === "task" ? item.sourceRef.id : undefined,
      articleId:
        item.sourceRef?.type === "article" ? item.sourceRef.id : undefined,
      focusAreaTitles: input.focusAreaTitles,
      riskLevel:
        item.riskLevel === "low"
          ? "LOW"
          : item.riskLevel === "high"
            ? "HIGH"
            : "MEDIUM",
      context,
      skipHermesEnhance: true,
    });

    briefByItemId.set(item.id, brief);
  }

  return input.items.map((item) => {
    const brief = briefByItemId.get(item.id);
    if (!brief) {
      return item;
    }
    return {
      ...item,
      researchBrief: briefToJson(brief) as AutopilotPlanItem["researchBrief"],
    };
  });
}

export async function refreshPlanItemResearchBrief(input: {
  item: AutopilotPlanItem;
  websiteId: string;
  organizationId: string;
  userId: string;
  focusAreaTitles?: string[];
}): Promise<ContentResearchBrief> {
  return generateContentResearchBrief({
    websiteId: input.websiteId,
    organizationId: input.organizationId,
    userId: input.userId,
    source: "AUTOPILOT_PLAN",
    briefId: `research-${input.item.id}`,
    planItemTitle: input.item.title,
    planItemReason: input.item.reason,
    taskId:
      input.item.sourceRef?.type === "task"
        ? input.item.sourceRef.id
        : undefined,
    articleId:
      input.item.sourceRef?.type === "article"
        ? input.item.sourceRef.id
        : undefined,
    focusAreaTitles: input.focusAreaTitles,
    riskLevel:
      input.item.riskLevel === "low"
        ? "LOW"
        : input.item.riskLevel === "high"
          ? "HIGH"
          : "MEDIUM",
  });
}
