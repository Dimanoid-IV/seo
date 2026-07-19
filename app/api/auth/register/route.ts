import { assertSaasConfigured } from "@/lib/auth/saas-config";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { registerUser } from "@/lib/auth/service";
import { scheduleWebsiteActivation } from "@/lib/onboarding/schedule-activation";
import { registerSchema } from "@/lib/validators/auth";

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
}

export const maxDuration = 60;

// TODO: rate limit — 5 registrations / hour / IP (docs/API-Design.md)

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

    const body = await parseJsonBody(request);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await registerUser(parsed.data);

    if (result.website?.id && result.organization?.id) {
      await scheduleWebsiteActivation({
        userId: result.user.id,
        organizationId: result.organization.id,
        websiteId: result.website.id,
        websiteUrl: result.website.url,
      });
    }

    return authJsonResponse(
      {
        user: result.user,
        organization: result.organization,
        website: result.website,
        subscription: result.subscription,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        ...(result.warnings?.length ? { warnings: result.warnings } : {}),
        ...(result.previewAuditId
          ? { previewAuditId: result.previewAuditId }
          : {}),
        ...(result.website?.id ? { activationStarted: true } : {}),
      },
      { status: 201, refreshToken: result.refreshToken }
    );
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
