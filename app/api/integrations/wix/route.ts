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
import { testWixConnection } from "@/lib/publishing/wix";
import {
  disconnectWixPublishingConfig,
  getWixPublishingConfig,
  isSafeWixSiteId,
  normalizeWixSiteId,
  upsertWixPublishingConfig,
} from "@/lib/publishing/wix-config";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(ErrorCode.INTERNAL_ERROR, "База данных не настроена.", {
      statusCode: 503,
    });
  }
}

const saveSchema = z.object({
  websiteId: z.string().uuid(),
  siteId: z
    .string()
    .trim()
    .min(8)
    .max(128)
    .transform((value) => normalizeWixSiteId(value))
    .refine((value) => isSafeWixSiteId(value), {
      message: "Use your Wix Site ID.",
    }),
  apiKey: z.string().trim().min(10).max(1200),
});

const websiteSchema = z.object({ websiteId: z.string().uuid() });

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
    const parsed = websiteSchema.safeParse({
      websiteId: url.searchParams.get("websiteId"),
    });
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    const website = await assertOwnedWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });
    const config = await getWixPublishingConfig(website.id);
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
    const test = await testWixConnection({
      siteId: parsed.data.siteId,
      apiKey: parsed.data.apiKey,
    });
    if (!test.ok) {
      return authJsonResponse({ data: { saved: false, test } }, { status: 400 });
    }

    const config = await upsertWixPublishingConfig({
      websiteId: website.id,
      organizationId: website.organizationId,
      siteId: parsed.data.siteId,
      apiKey: parsed.data.apiKey,
      tested: true,
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
    const parsed = websiteSchema.safeParse(body);
    if (!parsed.success) throw validationErrorFromZod(parsed.error);
    const website = await assertOwnedWebsite({
      websiteId: parsed.data.websiteId,
      userId: currentUser.id,
    });
    await disconnectWixPublishingConfig(website.id);
    return authJsonResponse({ data: { disconnected: true } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
