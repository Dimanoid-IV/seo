import { NextResponse } from "next/server";

import {
  buildAuditPreviewResponse,
  auditPreviewInputSchema,
  createAuditPreviewErrorResponse,
} from "@/lib/audit/preview-response";
import { createAuditPreviewToken } from "@/lib/audit/persist-preview";
import { extractOnPageSeo, runAuditRules, scanWebsite } from "@/lib/audit";
import { isDatabaseConfigured } from "@/lib/db";
import {
  getRequestIdFromRequest,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";

// TODO: Add IP-based rate limiting before public launch.

export async function POST(request: Request) {
  const requestId = getRequestIdFromRequest(request);

  try {
    const body = await parseJsonBody(request);
    const parsed = auditPreviewInputSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const inputUrl = parsed.data.url;
    const scan = await scanWebsite(inputUrl);
    const onPage = extractOnPageSeo(scan.html, scan.finalUrl);
    const results = runAuditRules({ scan, onPage });
    const payload = buildAuditPreviewResponse({
      inputUrl,
      scan,
      onPage,
      results,
      generatedAt: scan.fetchedAt,
    });

    let previewToken: string | null = null;
    let warning: string | null = null;

    if (!isDatabaseConfigured()) {
      warning = "preview_token_unavailable_no_database";
    } else {
      previewToken = await createAuditPreviewToken({
        inputUrl,
        normalizedUrl: scan.normalizedUrl,
        finalUrl: scan.finalUrl,
        statusCode: scan.statusCode,
        rawScore: payload.data.score.raw,
        estimatedFixMinutes: payload.data.summary.estimatedFixMinutes,
        preview: payload.data,
        results,
      });

      if (!previewToken) {
        warning = "preview_token_unavailable";
      }
    }

    return NextResponse.json(
      {
        ...payload,
        previewToken,
        ...(warning ? { warning } : {}),
      },
      {
        headers: {
          "X-Request-Id": requestId,
        },
      }
    );
  } catch (error) {
    const { status, body, headers } = createAuditPreviewErrorResponse(
      error,
      requestId
    );
    return NextResponse.json(body, { status, headers });
  }
}
