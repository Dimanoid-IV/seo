import { getPrisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { findActiveSubscription, findPrimaryOrganization } from "@/lib/auth/queries";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import {
  serializeOrganization,
  serializeSubscription,
  serializeUser,
} from "@/lib/auth/serialize";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const prisma = getPrisma();

    const dbUser = await prisma.user.findFirst({
      where: { id: currentUser.id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        emailVerified: true,
        role: true,
        onboardingCompletedAt: true,
      },
    });

    if (!dbUser) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Пользователь не найден или удалён");
    }

    let organization = currentUser.organizationId
      ? await prisma.organization.findFirst({
          where: {
            id: currentUser.organizationId,
            deletedAt: null,
          },
        })
      : null;

    if (!organization) {
      organization = await findPrimaryOrganization(prisma, currentUser.id);
    }

    const subscription = organization
      ? await findActiveSubscription(prisma, organization.id)
      : null;

    return authJsonResponse({
      user: serializeUser(dbUser),
      organization: organization ? serializeOrganization(organization) : null,
      subscription: subscription ? serializeSubscription(subscription) : null,
      onboardingCompleted: dbUser.onboardingCompletedAt !== null,
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
