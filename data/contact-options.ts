export const SERVICE_IDS = [
  "seo-audit",
  "technical-seo",
  "local-seo",
  "ecommerce-seo",
  "content-seo",
  "multilingual-seo",
  "landing-pages",
  "new-sites",
  "other",
] as const;

export const PLAN_IDS = [
  "start",
  "local-boost",
  "growth",
  "partner",
  "not-sure",
] as const;

export const BUDGET_IDS = [
  "under-200",
  "200-500",
  "500-1000",
  "over-1000",
  "not-sure",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];
export type PlanId = (typeof PLAN_IDS)[number];
export type BudgetId = (typeof BUDGET_IDS)[number];
