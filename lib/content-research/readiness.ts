import { parseContentResearchBrief } from "./parse";
import { getResearchDisplayStatus } from "./types";

/** True when a stored research brief is ready for Hermes article generation. */
export function isResearchBriefReadyForArticleGeneration(
  briefJson: unknown
): boolean {
  const brief = parseContentResearchBrief(briefJson);
  if (!brief) {
    return false;
  }

  return getResearchDisplayStatus(brief) === "ready";
}
