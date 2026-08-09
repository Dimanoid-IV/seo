/**
 * Integration adapter capability constants (Prompt 11.49).
 * No external network calls.
 */

export const IntegrationCapability = {
  CREATE_WORDPRESS_DRAFT: "create_wordpress_draft",
  UPDATE_WORDPRESS_ARTICLE: "update_wordpress_article",
  PUBLISH_WORDPRESS_ARTICLE: "publish_wordpress_article",
  /** Prompt 11.53 — move RankBoost-published WP post to draft/private. */
  ROLLBACK_WORDPRESS_ARTICLE: "article_rollback",
  APPLY_SEO_META: "apply_seo_meta",
  SEND_CUSTOM_WEBHOOK: "send_custom_webhook",
  PREPARE_UNIVERSAL_PACKAGE: "prepare_universal_package",
  HOSTED_BLOG_ARTICLE_CREATE: "hosted_blog_article_create",
  HOSTED_BLOG_ARTICLE_PUBLISH: "hosted_blog_article_publish",
  CMS_ARTICLE_CREATE: "cms_article_create",
  CMS_ARTICLE_UPDATE: "cms_article_update",
  CMS_ARTICLE_PUBLISH: "cms_article_publish",
  CMS_META_UPDATE: "cms_meta_update",
  CMS_ROLLBACK: "cms_rollback",
  ECOMMERCE_BLOG_PUBLISH: "ecommerce_blog_publish",
  ECOMMERCE_PRODUCT_SEO_UPDATE: "ecommerce_product_seo_update",
  GITHUB_CREATE_PULL_REQUEST: "github_create_pull_request",
  SITEMAP_DISCOVER_URLS: "sitemap_discover_urls",
  ANALYTICS_READ_METRICS: "analytics_read_metrics",
  LOCAL_PROFILE_READ: "local_profile_read",
  LOCAL_PROFILE_POST_PREPARE: "local_profile_post_prepare",
  NO_CODE_AUTOMATION_TRIGGER: "no_code_automation_trigger",
  TEST_CONNECTION: "test_connection",
  ROLLBACK_CHANGE: "rollback_change",
} as const;

export type IntegrationCapability =
  (typeof IntegrationCapability)[keyof typeof IntegrationCapability];

export const INTEGRATION_CAPABILITY_VALUES = Object.values(
  IntegrationCapability
) as IntegrationCapability[];

export function isIntegrationCapability(
  value: string
): value is IntegrationCapability {
  return (INTEGRATION_CAPABILITY_VALUES as string[]).includes(value);
}
