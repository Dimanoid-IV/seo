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
