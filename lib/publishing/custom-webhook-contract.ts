export const CUSTOM_WEBHOOK_HEADERS_EXAMPLE = `Content-Type: application/json
User-Agent: RankBoost-Webhook/1.0
X-RankBoost-Event: article.ready
X-RankBoost-Signature: sha256=<hmac hex, if shared secret is set>`;

export const CUSTOM_WEBHOOK_SUCCESS_RESPONSE_EXAMPLE = `{
  "ok": true,
  "externalId": "post_123",
  "url": "https://example.com/blog/article-slug"
}`;

export const CUSTOM_WEBHOOK_NEXTJS_ROUTE_EXAMPLE = `import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function verifySignature(body: string, secret: string, header: string | null) {
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
  return header === expected;
}

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.RANKBOOST_WEBHOOK_SECRET;

  if (secret && !verifySignature(body, secret, request.headers.get("x-rankboost-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const payload = JSON.parse(body);

  if (payload.event === "rankboost.test") {
    return NextResponse.json({ ok: true });
  }

  if (payload.event !== "article.ready") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const article = payload.article;

  // TODO: Save article.html, article.metaTitle and article.metaDescription
  // into your CMS/database and trigger your deploy/revalidation.

  return NextResponse.json({
    ok: true,
    externalId: article.id,
    url: \`https://YOUR_DOMAIN/blog/\${article.slug}\`,
  });
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
    "Задача: подключить публикацию статей RankBoost на custom-сайт.",
    "",
    "Нужно создать защищённый POST endpoint:",
    "https://YOUR_DOMAIN/api/rankboost/articles",
    "",
    "Требования:",
    "- Принимать JSON POST requests.",
    "- Возвращать любой HTTP 2xx, если статья принята.",
    "- Для теста принимать event = rankboost.test и не создавать контент.",
    "- Для реальной публикации обрабатывать event = article.ready.",
    "- Если задан shared secret, проверять X-RankBoost-Signature до записи контента (verify X-RankBoost-Signature).",
    "- Сохранять или публиковать article.html / article.markdown и SEO-поля.",
    "- Не публиковать дубликат, если idempotency/article.id уже был обработан.",
    "",
    "Самый простой вариант для Next.js / Vercel — файл app/api/rankboost/articles/route.ts:",
    CUSTOM_WEBHOOK_NEXTJS_ROUTE_EXAMPLE,
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
