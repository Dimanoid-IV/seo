/**
 * Custom publishing webhook delivery helpers (test + explicit send).
 * Never logs endpoint URL or payload body.
 */
import "server-only";

import { assertSafeUrl } from "@/lib/audit/ssrf";
import { AppError, ErrorCode } from "@/lib/errors";
import { getPrisma } from "@/lib/db";
import { buildUniversalExport } from "@/lib/publishing/universal-export";
import { loadBrandKitForWebsite } from "@/lib/brand-kit";
import {
  getCustomPublishingConfig,
  getCustomPublishingSharedSecret,
  getCustomPublishingWebhookUrl,
  upsertCustomPublishingConfig,
} from "@/lib/publishing/custom-webhook-config";
import { signWebhookPayload } from "@/lib/publishing/signature";

const WEBHOOK_TIMEOUT_MS = 10_000;

export type CustomWebhookDeliveryResult = {
  dryRun: boolean;
  delivered: boolean;
  statusCode: number;
  error: string | null;
  externalId?: string | null;
  externalUrl?: string | null;
  duplicate?: boolean;
  applied?: boolean;
};

async function readDeliveryResponse(
  response: Response
): Promise<
  Pick<
    CustomWebhookDeliveryResult,
    "externalId" | "externalUrl" | "duplicate" | "applied"
  >
> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {};
  }

  try {
    const body = (await response.json()) as {
      externalId?: unknown;
      url?: unknown;
      publicUrl?: unknown;
      duplicate?: unknown;
      applied?: unknown;
    };
    return {
      externalId:
        typeof body.externalId === "string" ? body.externalId.slice(0, 500) : null,
      externalUrl:
        typeof body.url === "string"
          ? body.url.slice(0, 2000)
          : typeof body.publicUrl === "string"
            ? body.publicUrl.slice(0, 2000)
            : null,
      duplicate: body.duplicate === true,
      applied: body.applied === true,
    };
  } catch {
    return {};
  }
}

export async function deliverCustomFixWebhook(input: {
  taskId: string;
  websiteId: string;
  organizationId: string;
  endpointUrl: string;
  dryRun: boolean;
  fix: {
    id: string;
    type: "META_FIX" | "SEO_FIX" | "TASK_FIX";
    field?: string;
    title: string;
    preview: string;
    suggestedValue: string;
    summary?: string;
    whyItMatters?: string;
    implementationNotes?: string;
    riskLevel?: "low" | "medium" | "high";
  };
}): Promise<CustomWebhookDeliveryResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.endpointUrl.trim());
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный URL webhook.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "URL должен использовать http или https."
    );
  }

  requireHttpsUnlessLocalDev(parsedUrl);
  await assertSafeUrl(parsedUrl);

  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      organizationId: input.organizationId,
      deletedAt: null,
    },
    select: { id: true, url: true },
  });
  if (!website) {
    throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
  }

  const payload = input.dryRun
    ? {
        event: "rankboost.test",
        dryRun: true,
        fix: {
          id: input.fix.id,
          type: input.fix.type,
          field: input.fix.field ?? null,
        },
      }
    : {
        event: "site.fix.ready",
        dryRun: false,
        task: { id: input.taskId },
        fix: {
          id: input.fix.id,
          type: input.fix.type,
          field: input.fix.field ?? null,
          title: input.fix.title,
          preview: input.fix.preview,
          suggestedValue: input.fix.suggestedValue,
          summary: input.fix.summary ?? null,
          whyItMatters: input.fix.whyItMatters ?? null,
          implementationNotes: input.fix.implementationNotes ?? null,
          riskLevel: input.fix.riskLevel ?? null,
        },
        website: {
          id: input.websiteId,
          url: website.url,
        },
      };

  const body = JSON.stringify(payload);
  const secret = await getCustomPublishingSharedSecret(input.websiteId);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "RankBoost-Webhook/1.0",
    "X-RankBoost-Event": payload.event,
  };
  if (secret) {
    headers["X-RankBoost-Signature"] = signWebhookPayload(body, secret);
  }

  let statusCode = 0;
  let delivered = false;
  let deliveryError: string | null = null;
  let deliveryResponse: Pick<
    CustomWebhookDeliveryResult,
    "externalId" | "externalUrl" | "duplicate" | "applied"
  > = {};

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: "manual",
    });
    statusCode = response.status;
    delivered = response.status >= 200 && response.status < 300;
    if (delivered) {
      deliveryResponse = await readDeliveryResponse(response);
    }
    if (!delivered) {
      deliveryError = `Эндпоинт вернул статус ${response.status}.`;
    }
  } catch {
    deliveryError =
      "Не удалось связаться с эндпоинтом. Проверьте URL и доступность.";
  }

  return {
    dryRun: input.dryRun,
    delivered,
    statusCode,
    error: deliveryError,
    ...deliveryResponse,
  };
}

function requireHttpsUnlessLocalDev(url: URL): void {
  if (url.protocol === "https:") return;
  if (
    process.env.NODE_ENV === "development" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return;
  }
  throw new AppError(
    ErrorCode.VALIDATION_ERROR,
    "Webhook URL должен использовать HTTPS."
  );
}

export async function deliverCustomWebhook(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  endpointUrl: string;
  dryRun: boolean;
  sharedSecret?: string | null;
  /** Persist config only after successful dry-run. */
  persistOnSuccess?: boolean;
  /** Enable only when a site already has an explicitly approved AUTO_PUBLISH plan. */
  autoSendEnabledOnPersist?: boolean;
}): Promise<CustomWebhookDeliveryResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.endpointUrl.trim());
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный URL webhook.");
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "URL должен использовать http или https."
    );
  }

  requireHttpsUnlessLocalDev(parsedUrl);
  await assertSafeUrl(parsedUrl);

  const prisma = getPrisma();
  const [article, website] = await Promise.all([
    prisma.article.findFirst({
      where: { id: input.articleId, websiteId: input.websiteId, deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        metaTitle: true,
        metaDescription: true,
        contentHtml: true,
        targetKeyword: true,
        language: true,
        qualityScore: true,
        qualityPassed: true,
      },
    }),
    prisma.website.findUnique({
      where: { id: input.websiteId },
      select: { id: true, url: true },
    }),
  ]);

  if (!article) {
    throw new AppError(ErrorCode.NOT_FOUND, "Статья не найдена");
  }

  if (!input.dryRun && article.qualityPassed !== true) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Отправка доступна только для статей, прошедших проверку качества."
    );
  }

  const brandKit = await loadBrandKitForWebsite(input.websiteId);

  const pkg = buildUniversalExport(
    {
      title: article.title,
      slug: article.slug,
      metaTitle: article.metaTitle,
      metaDescription: article.metaDescription,
      contentHtml: article.contentHtml,
      targetKeyword: article.targetKeyword,
      language: article.language,
    },
    { websiteUrl: website?.url ?? "", brandKit }
  );

  const payload = input.dryRun
    ? {
        event: "rankboost.test",
        dryRun: true,
        article: {
          id: article.id,
          slug: pkg.slug,
          metaTitle: pkg.metaTitle,
        },
      }
    : {
        event: "article.ready",
        dryRun: false,
        article: {
          id: article.id,
          title: article.title,
          slug: pkg.slug,
          metaTitle: pkg.metaTitle,
          metaDescription: pkg.metaDescription,
          canonicalUrl: pkg.canonicalUrl,
          html: pkg.html,
          markdown: pkg.markdown,
          language: String(article.language ?? "ru").toLowerCase(),
          targetKeyword: article.targetKeyword ?? "",
          qualityScore: article.qualityScore ?? null,
          brandKit: pkg.brandKit ?? null,
        },
        website: {
          id: input.websiteId,
          url: website?.url ?? "",
        },
      };

  const body = JSON.stringify(payload);
  const secret =
    input.sharedSecret?.trim() ||
    (await getCustomPublishingSharedSecret(input.websiteId));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "RankBoost-Webhook/1.0",
    "X-RankBoost-Event": payload.event,
  };
  if (secret) {
    headers["X-RankBoost-Signature"] = signWebhookPayload(body, secret);
  }

  let statusCode = 0;
  let delivered = false;
  let deliveryError: string | null = null;
  let deliveryResponse: Pick<
    CustomWebhookDeliveryResult,
    "externalId" | "externalUrl" | "duplicate"
  > = {};

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      redirect: "manual",
    });
    statusCode = response.status;
    delivered = response.status >= 200 && response.status < 300;
    if (delivered) {
      deliveryResponse = await readDeliveryResponse(response);
    }
    if (!delivered) {
      deliveryError = `Эндпоинт вернул статус ${response.status}.`;
    }
  } catch {
    deliveryError =
      "Не удалось связаться с эндпоинтом. Проверьте URL и доступность.";
  }

  if (input.dryRun && delivered && input.persistOnSuccess !== false) {
    try {
      await upsertCustomPublishingConfig({
        websiteId: input.websiteId,
        organizationId: input.organizationId,
        endpointUrl: parsedUrl.toString(),
        tested: true,
        autoSendEnabled: input.autoSendEnabledOnPersist === true,
        sharedSecret: secret || null,
      });
    } catch {
      // Config persistence must not fail the test response.
    }
  }

  return {
    dryRun: input.dryRun,
    delivered,
    statusCode,
    error: deliveryError,
    ...deliveryResponse,
  };
}

export async function assertWebhookReadyForExplicitSend(
  websiteId: string
): Promise<void> {
  const config = await getCustomPublishingConfig(websiteId);
  if (!config?.endpointConfigured || !config.testedAt) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Сначала проверьте и сохраните webhook."
    );
  }
  const url = await getCustomPublishingWebhookUrl(websiteId);
  if (!url) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "Webhook URL не настроен."
    );
  }
}
