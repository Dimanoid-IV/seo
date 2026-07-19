/**
 * Pure helpers for WordPress draft eligibility (no DB / network).
 */
import type { ArticleStatus } from "@prisma/client";

export function canCreateWordPressDraftForQuality(input: {
  qualityPassed: boolean | null | undefined;
  status: ArticleStatus | string;
}): boolean {
  if (input.qualityPassed === false) return false;
  if (input.status === "APPROVED") return true;
  if (input.status === "DRAFT") return true;
  if (input.status === "WAITING_REVIEW") {
    return input.qualityPassed === true;
  }
  return false;
}
