import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  disconnectNoCodeAutomationConfig,
  getNoCodeAutomationConfig,
  parseNoCodeAutomationProvider,
} from "@/lib/publishing/no-code-automation-config";
import { testAndSaveNoCodeAutomation } from "@/lib/publishing/no-code-automation";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "База данных не настроена.", {
      statusCode: 503,
    });
  }
}

const providerSchema = z
  .string()
  .transform((value) => parseNoCodeAutomationProvider(value))
  .refine((value) => value !== null, {
    message: "Provider must be zapier or make.",
  });

const saveSchema = z.object({
  websiteId: z.string().uuid(),
  provider: providerSchema,
  endpointUrl: z.string().trim().url().max(2000),
  sharedSecret: z.string().trim().max(400).optional(),
});

const querySchema = z.object({
  websiteId: z.string().uuid(),
  provider: providerSchema,
});

async function assertOwnedWebsite(input: { websiteId: string; userId: string }) {
  const prisma = getPrisma();
  const website = await prisma.website.findFirst({
    where: {
      id: input.websiteId,
      deletedAt: null,
      organization: { ownerUserId: input.userId, deletedAt: null },
    },
    select: { id: true, organizationId: true },
  });
  if (!website) throw new AppError(ErrorCode.NOT_FOUND, "Сайт не найден");
  return website;
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      websiteId: url.searchParams.get("websiteId"),
      provider: url.searchParams.get("provider"),
    });
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    const website = await assertOwnedWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });
    const config = await getNoCodeAutomationConfig({
      websiteId: website.id,
      provider: parsed.data.provider!,
    });
    return authJsonResponse({ data: { config } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);

    const website = await assertOwnedWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });
    const test = await testAndSaveNoCodeAutomation({
      websiteId: website.id,
      organizationId: website.organizationId,
      provider: parsed.data.provider!,
      endpointUrl: parsed.data.endpointUrl,
      sharedSecret: parsed.data.sharedSecret,
    });
    if (!test.delivered) {
      return authJsonResponse({ data: { saved: false, test } }, { status: 400 });
    }
    const config = await getNoCodeAutomationConfig({
      websiteId: website.id,
      provider: parsed.data.provider!,
    });
    return authJsonResponse({ data: { saved: true, test, config } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    const website = await assertOwnedWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });
    await disconnectNoCodeAutomationConfig({
      websiteId: website.id,
      provider: parsed.data.provider!,
    });
    return authJsonResponse({ data: { disconnected: true } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
