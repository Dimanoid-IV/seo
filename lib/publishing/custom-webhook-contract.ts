export const CUSTOM_WEBHOOK_HEADERS_EXAMPLE = `Content-Type: application/json
User-Agent: RankBoost-Webhook/1.0
X-RankBoost-Event: article.ready
X-RankBoost-Signature: sha256=<hmac hex, if shared secret is set>`;

export const CUSTOM_WEBHOOK_SUCCESS_RESPONSE_EXAMPLE = `{
  "ok": true,
  "externalId": "post_123",
  "url": "https://example.com/blog/article-slug"
}`;

export const CUSTOM_WEBHOOK_PAYLOAD_EXAMPLE = `{
  "event": "article.ready",
  "dryRun": false,
  "article": {
    "id": "article_uuid",
    "title": "Article title",
    "slug": "article-slug",
    "metaTitle": "SEO title",
    "metaDescription": "SEO meta description",
    "canonicalUrl": "https://example.com/blog/article-slug",
    "html": "<!doctype html>...",
    "markdown": "# Article title\\n\\n...",
    "language": "ru",
    "targetKeyword": "buyer search query",
    "qualityScore": 100,
    "brandKit": {
      "primaryColor": "#2563eb",
      "secondaryColor": "#0f172a",
      "accentColor": "#2563eb",
      "palette": ["#2563eb", "#0f172a"]
    }
  },
  "website": {
    "id": "website_uuid",
    "url": "https://example.com"
  }
}`;

export function buildCustomWebhookDeveloperBrief(): string {
  return [
    "Create a protected POST endpoint for RankBoost article publishing.",
    "",
    "Requirements:",
    "- Accept JSON POST requests.",
    "- Return any HTTP 2xx status when the article was accepted.",
    "- For test events, accept event = rankboost.test without creating content.",
    "- For real publishing, handle event = article.ready.",
    "- If a shared secret is set, verify X-RankBoost-Signature before writing content.",
    "- Store or publish article.html / article.markdown and SEO fields.",
    "",
    "Headers:",
    CUSTOM_WEBHOOK_HEADERS_EXAMPLE,
    "",
    "Payload:",
    CUSTOM_WEBHOOK_PAYLOAD_EXAMPLE,
    "",
    "Success response example:",
    CUSTOM_WEBHOOK_SUCCESS_RESPONSE_EXAMPLE,
  ].join("\n");
}
