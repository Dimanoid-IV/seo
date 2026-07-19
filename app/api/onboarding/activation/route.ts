import { requireUser } from "@/lib/auth/current-user";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { getActivationStateForUser } from "@/lib/onboarding/activation-state";
import {
  runActivationPipelineSafe,
} from "@/lib/onboarding/activation-pipeline";
import { findPrimaryOrganization } from "@/lib/auth/queries";
import { getPrisma } from "@/lib/db";
import { WebsiteStatus } from "@prisma/client";
import {
  readSiteTechFromBusinessGoals,
} from "@/lib/onboarding/site-tech-persist";
import { readBrandVoiceFromBusinessGoals } from "@/lib/brand-voice/business-goals";

export const maxDuration = 60;

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const activation = await getActivationStateForUser(currentUser.id);

    const prisma = getPrisma();
    const organization = await findPrimaryOrganization(prisma, currentUser.id);
    const website = organization
      ? await prisma.website.findFirst({
          where: {
            organizationId: organization.id,
            deletedAt: null,
            status: WebsiteStatus.ACTIVE,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true, businessGoals: true },
        })
      : null;

    const siteTech = readSiteTechFromBusinessGoals(website?.businessGoals);
    const brandVoice = readBrandVoiceFromBusinessGoals(website?.businessGoals);

    return authJsonResponse({
      data: {
        activation,
        siteTech: siteTech
          ? { platform: siteTech.platform, confidence: siteTech.confidence }
          : null,
        brandVoice: brandVoice
          ? {
              confidence: brandVoice.confidence,
              tone: brandVoice.tone,
              audience: brandVoice.audience,
            }
          : null,
        website: website
          ? { id: website.id, url: website.url }
          : null,
      },
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = (await request.json().catch(() => ({}))) as {
      retry?: boolean;
      websiteId?: string;
    };

    const prisma = getPrisma();
    const organization = await findPrimaryOrganization(prisma, currentUser.id);
    if (!organization) {
      throw new AppError(ErrorCode.NOT_FOUND, "Organization not found");
    }

    const website = await prisma.website.findFirst({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        status: WebsiteStatus.ACTIVE,
        ...(body.websiteId ? { id: body.websiteId } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true },
    });

    if (!website) {
      throw new AppError(ErrorCode.NOT_FOUND, "Website not found");
    }

    const summary = await runActivationPipelineSafe({
      userId: currentUser.id,
      organizationId: organization.id,
      websiteId: website.id,
      websiteUrl: website.url,
      retry: body.retry !== false,
    });

    return authJsonResponse({ data: { summary } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
