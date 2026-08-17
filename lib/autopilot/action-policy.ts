export type AutopilotActionKind =
  | "META_DESCRIPTION"
  | "INTERNAL_LINKS"
  | "FAQ"
  | "BLOG_ARTICLE"
  | "IMAGE_ALT"
  | "SMALL_CONTENT_REFRESH"
  | "HOMEPAGE_H1"
  | "LANDING_PAGE_REWRITE"
  | "DELETE_PAGE"
  | "REDIRECT"
  | "PRICING_COPY"
  | "LEGAL_CONTENT"
  | "COMMERCIAL_CLAIM"
  | "MASS_DELETE"
  | "AUTHENTICATION_CHANGE"
  | "PAYMENT_CHANGE"
  | "INFRASTRUCTURE_DESTRUCTIVE";

export type ActionPolicyDecision = "SAFE_AUTO" | "REVIEW_REQUIRED" | "BLOCKED";

const SAFE_AUTO = new Set<AutopilotActionKind>([
  "META_DESCRIPTION",
  "INTERNAL_LINKS",
  "FAQ",
  "BLOG_ARTICLE",
  "IMAGE_ALT",
  "SMALL_CONTENT_REFRESH",
]);

const BLOCKED = new Set<AutopilotActionKind>([
  "MASS_DELETE",
  "AUTHENTICATION_CHANGE",
  "PAYMENT_CHANGE",
  "INFRASTRUCTURE_DESTRUCTIVE",
]);

export function decideActionPolicy(input: {
  kind: AutopilotActionKind;
  reversible: boolean;
  touchesLegalOrPricing?: boolean;
}): ActionPolicyDecision {
  if (BLOCKED.has(input.kind)) return "BLOCKED";
  if (input.touchesLegalOrPricing || !input.reversible) return "REVIEW_REQUIRED";
  return SAFE_AUTO.has(input.kind) ? "SAFE_AUTO" : "REVIEW_REQUIRED";
}

export function canExecuteActionAutomatically(input: {
  mode: "OFF" | "REVIEW" | "AUTO";
  policy: ActionPolicyDecision;
  approved?: boolean;
}): boolean {
  if (input.mode === "OFF" || input.policy === "BLOCKED") return false;
  if (input.mode === "AUTO" && input.policy === "SAFE_AUTO") return true;
  return input.approved === true;
}
