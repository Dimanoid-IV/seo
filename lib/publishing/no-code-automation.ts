import "server-only";

import {
  IntegrationExecutionAction,
  IntegrationExecutionMode,
  IntegrationExecutionProvider,
  IntegrationExecutionSourceType,
  IntegrationExecutionStatus,
} from "@prisma/client";

import { assertSafeUrl } from "@/lib/audit/ssrf";
import { AppError, ErrorCode } from "@/lib/errors";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";
import {
  appendIntegrationExecutionEvent,
  createIntegrationExecutionJob,
  markExecutionJobFailed,
  markExecutionJobRunning,
  markExecutionJobSucceeded,
} from "@/lib/integrations/execution-jobs";
import {
  deliverCustomWebhook,
  type CustomWebhookDeliveryResult,
} from "@/lib/publishing/custom-webhook";
import {
  getNoCodeAutomationConfig,
  getNoCodeAutomationSharedSecret,
  getNoCodeAutomationWebhookUrl,
  type NoCodeAutomationProvider,
  upsertNoCodeAutomationConfig,
} from "@/lib/publishing/no-code-automation-config";

const PROVIDER_TO_EXECUTION = {
  zapier: IntegrationExecutionProvider.ZAPIER,
  make: IntegrationExecutionProvider.MAKE,
} as const satisfies Record<
  NoCodeAutomationProvider,
  IntegrationExecutionProvider
>;

function providerLabel(provider: NoCodeAutomationProvider): string {
  return provider === "zapier" ? "Zapier" : "Make";
}

function requireHttps(url: URL): void {
  if (url.protocol !== "https:") {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      "No-code webhook URL должен использовать HTTPS."
    );
  }
}

export async function testAndSaveNoCodeAutomation(input: {
  websiteId: string;
  organizationId: string;
  provider: NoCodeAutomationProvider;
  endpointUrl: string;
  sharedSecret?: string | null;
}): Promise<CustomWebhookDeliveryResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input.endpointUrl.trim());
  } catch {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Некорректный webhook URL.");
  }
  requireHttps(parsedUrl);
  await assertSafeUrl(parsedUrl);

  const result = await testAutomationEndpoint({
    provider: input.provider,
    endpointUrl: parsedUrl.toString(),
    sharedSecret: input.sharedSecret,
  });

  if (result.delivered) {
    await upsertNoCodeAutomationConfig({
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      provider: input.provider,
      endpointUrl: parsedUrl.toString(),
      tested: true,
      sharedSecret: input.sharedSecret,
    });
  }
  return result;
}

async function testAutomationEndpoint(input: {
  provider: NoCodeAutomationProvider;
  endpointUrl: string;
  sharedSecret?: string | null;
}): Promise<CustomWebhookDeliveryResult> {
  const { signWebhookPayload } = await import("@/lib/publishing/signature");
  const payload = {
    event: "rankboost.test",
    dryRun: true,
    provider: input.provider,
    source: "rankboost",
  };
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "RankBoost-NoCode/1.0",
    "X-RankBoost-Event": payload.event,
  };
  if (input.sharedSecret?.trim()) {
    headers["X-RankBoost-Signature"] = signWebhookPayload(
      body,
      input.sharedSecret.trim()
    );
  }

  try {
    const response = await fetch(input.endpointUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10_000),
      redirect: "manual",
    });
    return {
      dryRun: true,
      delivered: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      error:
        response.status >= 200 && response.status < 300
          ? null
          : `Эндпоинт вернул статус ${response.status}.`,
    };
  } catch {
    return {
      dryRun: true,
      delivered: false,
      statusCode: 0,
      error: "Не удалось связаться с no-code webhook.",
    };
  }
}

export async function sendArticleToNoCodeAutomation(input: {
  articleId: string;
  websiteId: string;
  organizationId: string;
  userId: string;
  provider: NoCodeAutomationProvider;
  dryRun?: boolean;
}): Promise<CustomWebhookDeliveryResult & { jobId?: string }> {
  const [config, endpointUrl, sharedSecret] = await Promise.all([
    getNoCodeAutomationConfig({
      websiteId: input.websiteId,
      provider: input.provider,
    }),
    getNoCodeAutomationWebhookUrl({
      websiteId: input.websiteId,
      provider: input.provider,
    }),
    getNoCodeAutomationSharedSecret({
      websiteId: input.websiteId,
      provider: input.provider,
    }),
  ]);

  if (!config?.connected || !endpointUrl) {
    throw new AppError(
      ErrorCode.VALIDATION_ERROR,
      `${providerLabel(input.provider)} не подключён.`
    );
  }

  const { job } = await createIntegrationExecutionJob({
    organizationId: input.organizationId,
    websiteId: input.websiteId,
    requestedByUserId: input.userId,
    approvedByUserId: input.userId,
    sourceType: IntegrationExecutionSourceType.ARTICLE,
    sourceId: input.articleId,
    action: IntegrationExecutionAction.SEND_WEBHOOK,
    provider: PROVIDER_TO_EXECUTION[input.provider],
    mode: IntegrationExecutionMode.REVIEW_ONLY,
    capability: IntegrationCapability.NO_CODE_AUTOMATION_TRIGGER,
    idempotencyKey: `${input.provider}:article:${input.articleId}`,
    requestPreview: {
      provider: input.provider.toUpperCase(),
      endpointHost: config.endpointHost,
      dryRun: input.dryRun !== false,
    },
  });

  if (job.status === IntegrationExecutionStatus.SUCCEEDED) {
    return {
      dryRun: false,
      delivered: true,
      statusCode: 200,
      error: null,
      externalId: job.externalId,
      externalUrl: job.externalUrl,
      jobId: job.id,
    };
  }

  await appendIntegrationExecutionEvent({
    jobId: job.id,
    type: "queued",
    status: IntegrationExecutionStatus.QUEUED,
    message: `${providerLabel(input.provider)} article trigger queued.`,
  });

  if (input.dryRun !== false) {
    return {
      dryRun: true,
      delivered: false,
      statusCode: 0,
      error: null,
      jobId: job.id,
    };
  }

  await markExecutionJobRunning(job.id);
  try {
    const result = await deliverCustomWebhook({
      articleId: input.articleId,
      websiteId: input.websiteId,
      organizationId: input.organizationId,
      endpointUrl,
      dryRun: false,
      sharedSecret,
      persistOnSuccess: false,
    });

    if (!result.delivered) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        result.error ?? `${providerLabel(input.provider)} webhook failed.`
      );
    }

    await markExecutionJobSucceeded({
      jobId: job.id,
      externalId: result.externalId ?? null,
      externalUrl: result.externalUrl ?? null,
      result: {
        provider: input.provider,
        statusCode: result.statusCode,
        duplicate: result.duplicate === true,
      },
    });
    return { ...result, jobId: job.id };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : `${providerLabel(input.provider)} trigger failed.`;
    await markExecutionJobFailed({
      jobId: job.id,
      errorCode: error instanceof AppError ? error.code : "no_code_failed",
      errorMessage: message,
    });
    throw error;
  }
}
