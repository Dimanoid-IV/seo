import { getPrisma } from "@/lib/db";
import { assertSaasConfigured } from "@/lib/auth/saas-config";
import { AppError, ErrorCode } from "@/lib/errors";
import { requireUser } from "@/lib/auth/current-user";
import { resolveOwnedOrganization } from "@/lib/auth/queries";
import { authErrorResponse, authJsonResponse } from "@/lib/auth/responses";
import {
  serializeOrganization,
  serializeUser,
} from "@/lib/auth/serialize";
import { getSubscriptionPlanSummary } from "@/lib/billing/plan-summary";
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
      ? await getSubscriptionPlanSummary({
          userId: currentUser.id,
          organizationId: organization.id,
        })
      : null;

    const onboarding = await getOnboardingSummary(currentUser.id);

    return authJsonResponse({
      user: serializeUser(dbUser),
      organization: organization ? serializeOrganization(organization) : null,
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            planLabel: subscription.planLabel,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      onboardingCompleted:
        onboarding.status === "COMPLETED" || onboarding.status === "SKIPPED",
      onboarding,
    });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
