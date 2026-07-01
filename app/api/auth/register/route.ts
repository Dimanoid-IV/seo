import { assertSaasConfigured } from "@/lib/auth/saas-config";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { registerUser } from "@/lib/auth/service";
import { registerSchema } from "@/lib/validators/auth";

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
}

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

    return authJsonResponse(
      {
        user: result.user,
        organization: result.organization,
        website: result.website,
        subscription: result.subscription,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        ...(result.warnings?.length ? { warnings: result.warnings } : {}),
        ...(result.previewAuditId ? { previewAuditId: result.previewAuditId } : {}),
      },
      { status: 201, refreshToken: result.refreshToken }
    );
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
