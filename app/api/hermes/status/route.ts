import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import { getHermesConnectionStatus } from "@/lib/hermes/client";

export async function GET(request: Request) {
  try {
    await requireUser(request);

    const testConnection =
      new URL(request.url).searchParams.get("test") === "1";

    const status = await getHermesConnectionStatus({
      testConnection,
    });

    return authJsonResponse({ data: { hermes: status } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
