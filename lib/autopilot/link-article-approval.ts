import type {
  AutopilotPlanItem,
  AutopilotPlanItemsDocument,
} from "./plan-item-types";

export type ArticleApprovalPlanLinkResult = {
  document: AutopilotPlanItemsDocument;
  matchedItemIds: string[];
};

/**
 * Updates autopilot plan items linked to an approved article.
 * Preserves scheduling metadata; never marks items executed (runner handles WP draft).
 */
export function updatePlanItemsForArticleApproval(
  document: AutopilotPlanItemsDocument,
  articleId: string,
  approvedAt: string
): ArticleApprovalPlanLinkResult {
  const matchedItemIds: string[] = [];

  const items = document.items.map((item) => {
    if (item.generatedArticleId !== articleId) {
      return item;
    }

    matchedItemIds.push(item.id);

    return applyArticleApprovalToPlanItem(item, approvedAt);
  });

  return {
    document: { ...document, items },
    matchedItemIds,
  };
}

export function applyArticleApprovalToPlanItem(
  item: AutopilotPlanItem,
  approvedAt: string
): AutopilotPlanItem {
  const preserveWpBlock = item.blockedReasonKey === "wordpressNotConnected";

  return {
    ...item,
    linkedArticleApprovedAt: approvedAt,
    blockedReasonKey: preserveWpBlock ? item.blockedReasonKey : undefined,
  };
}
