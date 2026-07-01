import { getPrisma } from "@/lib/db";
import { assertSaasConfigured } from "@/lib/auth/saas-config";
import { AppError, ErrorCode } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { findActiveSubscription, resolveOwnedOrganization } from "@/lib/auth/queries";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import {
  serializeOrganization,
  serializeSubscription,
  serializeUser,
} from "@/lib/auth/serialize";
import { getOnboardingSummary } from "@/lib/onboarding/get-onboarding-state";

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
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

    const organization = await resolveOwnedOrganization(
      prisma,
      currentUser.id,
      currentUser.organizationId
    );

    const subscription = organization
      ? await findActiveSubscription(prisma, organization.id)
      : null;

    const onboarding = await getOnboardingSummary(currentUser.id);

    return authJsonResponse({
      user: serializeUser(dbUser),
      organization: organization ? serializeOrganization(organization) : null,
      subscription: subscription ? serializeSubscription(subscription) : null,
      onboardingCompleted:
        onboarding.status === "COMPLETED" || onboarding.status === "SKIPPED",
      onboarding,
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
