import type { AutopilotFocusArea } from "@/lib/autopilot/types";
import type { SaasDictionary } from "./types";

type FocusAreaCopy = {
  title: string;
  description: string;
  reason: string;
};

function replaceCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function resolveTechnicalSeoReason(
  area: AutopilotFocusArea,
  copy: SaasDictionary["dashboard"]["focusAreas"]["technicalSeo"]
): string {
  const count =
    typeof area.reasonParams?.count === "number"
      ? area.reasonParams.count
      : area.relatedTaskIds?.length ?? 0;

  if (area.reasonKey === "criticalFindings" && count > 0) {
    return count === 1
      ? copy.criticalFindingOne
      : replaceCount(copy.criticalFindingMany, count);
  }

  if (area.reasonKey === "highPriorityTasksOne" || count === 1) {
    return copy.noteOne;
  }

  if (area.reasonKey === "highPriorityTasksMany" || count > 1) {
    return replaceCount(copy.noteMany, count);
  }

  return copy.noteOne;
}

function resolveContentProductionReason(
  area: AutopilotFocusArea,
  copy: SaasDictionary["dashboard"]["focusAreas"]["contentProduction"]
): string {
  const draftCount =
    typeof area.reasonParams?.count === "number"
      ? area.reasonParams.count
      : area.relatedArticleIds?.length ?? 0;

  if (area.reasonKey === "draftsNeedProgress" && draftCount > 0) {
    return draftCount === 1
      ? copy.draftsNeedProgressOne
      : replaceCount(copy.draftsNeedProgressMany, draftCount);
  }

  if (area.reasonKey === "gapsFromAudit" || draftCount === 0) {
    return copy.note;
  }

  return draftCount === 1
    ? copy.draftsNeedProgressOne
    : replaceCount(copy.draftsNeedProgressMany, draftCount);
}

function resolveIntegrationReason(
  area: AutopilotFocusArea,
  copy: SaasDictionary["dashboard"]["focusAreas"]["integrationDataQuality"]
): string {
  if (area.reasonKey === "needsAttention") {
    return copy.needsAttention;
  }
  if (area.reasonKey === "gscNotConnected") {
    return copy.note;
  }
  return copy.note;
}

/** Maps persisted focus area ids to localized dashboard copy. */
export function localizeFocusArea(
  area: AutopilotFocusArea,
  dict: SaasDictionary
): FocusAreaCopy {
  const fa = dict.dashboard.focusAreas;

  switch (area.id) {
    case "technical-seo":
      return {
        title: fa.technicalSeo.title,
        description: fa.technicalSeo.description,
        reason: resolveTechnicalSeoReason(area, fa.technicalSeo),
      };
    case "integration-data":
      return {
        title: fa.integrationDataQuality.title,
        description: fa.integrationDataQuality.description,
        reason: resolveIntegrationReason(area, fa.integrationDataQuality),
      };
    case "content-production":
      return {
        title: fa.contentProduction.title,
        description: fa.contentProduction.description,
        reason: resolveContentProductionReason(area, fa.contentProduction),
      };
    case "gsc-opportunities":
      return {
        title: fa.gscOpportunities.title,
        description: fa.gscOpportunities.description,
        reason:
          typeof area.reasonParams?.count === "number" && area.reasonParams.count > 0
            ? replaceCount(fa.gscOpportunities.foundMany, area.reasonParams.count)
            : fa.gscOpportunities.potential,
      };
    case "social-distribution":
      return {
        title: fa.socialDistribution.title,
        description: fa.socialDistribution.description,
        reason:
          typeof area.reasonParams?.count === "number" && area.reasonParams.count > 0
            ? replaceCount(fa.socialDistribution.readyMany, area.reasonParams.count)
            : fa.socialDistribution.newContent,
      };
    case "review-approval":
      return {
        title: fa.reviewApproval.title,
        description: fa.reviewApproval.description,
        reason:
          typeof area.reasonParams?.count === "number"
            ? replaceCount(fa.reviewApproval.waitingMany, area.reasonParams.count)
            : fa.reviewApproval.waitingMany.replace("{count}", "0"),
      };
    default:
      return {
        title: area.title,
        description: area.description,
        reason: area.reason,
      };
  }
}

export function localizeFocusAreaPriority(
  priority: string,
  dict: SaasDictionary
): string {
  const p = dict.dashboard.priority;
  switch (priority) {
    case "HIGH":
      return p.high;
    case "MEDIUM":
      return p.medium;
    case "LOW":
      return p.low;
    default:
      return priority;
  }
}
