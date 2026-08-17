import { assertSaasConfigured } from "@/lib/auth/saas-config";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { loginUser } from "@/lib/auth/service";
import { loginSchema } from "@/lib/validators/auth";
import { enforceRateLimit } from "@/lib/security/rate-limit";

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
}

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    await enforceRateLimit({ request, scope: "auth.login", limit: 10, windowMs: 60_000 });

    const body = await parseJsonBody(request);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const result = await loginUser(parsed.data.email, parsed.data.password);

    return authJsonResponse(
      {
        user: result.user,
        organization: result.organization,
        subscription: result.subscription,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
      { refreshToken: result.refreshToken }
    );
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
