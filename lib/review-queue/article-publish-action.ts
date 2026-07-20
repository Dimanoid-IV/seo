import type { ReviewQueueItem } from "./types";

export function canPublishArticleToCustomSiteFromReview(
  item: Pick<ReviewQueueItem, "type" | "articleContext">
): boolean {
  return (
    item.type === "ARTICLE_DRAFT" &&
    item.articleContext?.qualityPassed === true &&
    item.articleContext?.customPublishingConnected === true
  );
}

