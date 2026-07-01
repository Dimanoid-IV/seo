import { assertSaasConfigured } from "@/lib/auth/saas-config";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { loginUser } from "@/lib/auth/service";
import { loginSchema } from "@/lib/validators/auth";

function assertDatabaseConfigured(): void {
  assertSaasConfigured();
}

// TODO: rate limit — 10 login attempts / min / IP (docs/API-Design.md)

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();

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
