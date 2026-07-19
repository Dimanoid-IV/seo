/**
 * Product analytics event names — first-ad funnel (Prompt 11.47).
 */

export const PRODUCT_EVENTS = [
  // Public funnel
  "landing_view",
  "pricing_view",
  "register_click",
  "login_click",
  "plan_cta_click",
  "checkout_started",
  // Auth / onboarding
  "account_created",
  "website_added",
  "activation_started",
  "activation_step_completed",
  "activation_step_failed",
  "audit_started",
  "audit_completed",
  "site_tech_detected",
  "brand_voice_extracted",
  // Core product
  "monthly_plan_created",
  "monthly_plan_opened",
  "monthly_plan_approved",
  "article_topic_opened",
  "article_draft_started",
  "article_draft_created",
  "article_quality_passed",
  "article_quality_failed",
  "review_opened",
  "review_item_approved",
  "article_export_clicked",
  "wordpress_draft_created",
  "webhook_tested",
  // Billing
  "billing_page_opened",
  "checkout_success_seen",
  "subscription_synced",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

export function isProductEventName(value: string): value is ProductEventName {
  return (PRODUCT_EVENTS as readonly string[]).includes(value);
}

export type TrackEventInput = {
  event: ProductEventName | string;
  userId?: string | null;
  organizationId?: string | null;
  websiteId?: string | null;
  route?: string | null;
  locale?: string | null;
  properties?: Record<string, unknown> | null;
};

/** Ordered funnel steps for drop-off reporting */
export const FUNNEL_STEPS: ProductEventName[] = [
  "landing_view",
  "register_click",
  "account_created",
  "website_added",
  "activation_started",
  "audit_completed",
  "brand_voice_extracted",
  "monthly_plan_created",
  "monthly_plan_approved",
  "article_draft_created",
  "article_quality_passed",
  "review_opened",
  "article_export_clicked",
  "billing_page_opened",
  "checkout_started",
];
