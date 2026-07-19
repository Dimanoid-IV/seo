import { NextResponse } from "next/server";

import { verifyWebhookSignature } from "@/lib/publishing/signature";

/**
 * Safe public echo endpoint for RankBoost custom-webhook QA.
 * Accepts ONLY test events — never stores payloads, never accepts article HTML.
 *
 * Optional: set RANKBOOST_ECHO_VERIFY_SECRET to verify X-RankBoost-Signature.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: Record<string, unknown> = {};
  try {
    body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  const event = typeof body.event === "string" ? body.event : "";
  const dryRun = body.dryRun === true || body.dryRun === undefined;
  const allowed =
    event === "rankboost.test" ||
    event === "rankboost.webhook.test" ||
    (event === "article.ready" && dryRun === true && !hasArticleContent(body));

  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "only_test_events_accepted",
        hint: "Send event=rankboost.test (dry-run). Full article publish is rejected.",
      },
      { status: 400 }
    );
  }

  if (hasArticleContent(body)) {
    return NextResponse.json(
      { ok: false, error: "article_content_not_allowed_on_echo" },
      { status: 400 }
    );
  }

  const signature = request.headers.get("x-rankboost-signature");
  const hasSignature = Boolean(signature);
  let signatureValid: boolean | null = null;

  const verifySecret = process.env.RANKBOOST_ECHO_VERIFY_SECRET?.trim();
  if (verifySecret && hasSignature) {
    signatureValid = verifyWebhookSignature(rawBody, verifySecret, signature);
    if (!signatureValid) {
      return NextResponse.json(
        { ok: false, error: "invalid_signature" },
        { status: 401 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    event,
    dryRun: true,
    hasSignature,
    signatureValid,
    // Never echo back secrets or full bodies.
  });
}

function hasArticleContent(body: Record<string, unknown>): boolean {
  const article = body.article;
  if (!article || typeof article !== "object" || Array.isArray(article)) {
    return false;
  }
  const a = article as Record<string, unknown>;
  return (
    typeof a.html === "string" ||
    typeof a.markdown === "string" ||
    typeof a.bodyHtml === "string" ||
    typeof a.contentHtml === "string"
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    purpose: "rankboost_custom_webhook_echo",
    accepts: ["rankboost.test"],
    rejects: ["article.ready with html/markdown"],
  });
}
