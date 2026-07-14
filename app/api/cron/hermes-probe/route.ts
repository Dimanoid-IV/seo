import { getHermesEnvConfig } from "@/lib/hermes/config";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { getServerEnv } from "@/lib/env";

function safeHost(apiUrl: string | null): string | null {
  if (!apiUrl?.trim()) {
    return null;
  }

  try {
    return new URL(apiUrl.trim().replace(/\/$/, "")).host;
  } catch {
    return "invalid_url";
  }
}

async function probeUrl(
  url: string,
  init: RequestInit
): Promise<{ status: number; ok: boolean; error: string | null }> {
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(15_000),
    });

    return {
      status: response.status,
      ok: response.ok,
      error: null,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error:
        error instanceof Error && error.name === "TimeoutError"
          ? "timeout"
          : "network_error",
    };
  }
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getHermesEnvConfig();
  const apiUrl = config.apiUrl?.replace(/\/$/, "") ?? null;
  const hasSecret = Boolean(config.apiSecret?.trim());

  if (!apiUrl || !hasSecret) {
    return Response.json({
      data: {
        configured: false,
        host: safeHost(apiUrl),
        hasApiUrl: Boolean(apiUrl),
        hasApiSecret: hasSecret,
      },
    });
  }

  const authHeader = { Authorization: `Bearer ${config.apiSecret}` };

  const [health, generate] = await Promise.all([
    probeUrl(`${apiUrl}/v1/health`, {
      method: "GET",
      headers: authHeader,
    }),
    probeUrl(`${apiUrl}/v1/generate/article`, {
      method: "POST",
      headers: {
        ...authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }),
  ]);

  const result = {
    configured: true,
    host: safeHost(apiUrl),
    nodeEnv: getServerEnv().NODE_ENV,
    health,
    generate: {
      ...generate,
      note:
        generate.status === 400 || generate.status === 422
          ? "endpoint_reachable_validation_failed"
          : generate.status === 404
            ? "endpoint_not_found"
            : generate.status === 401 || generate.status === 403
              ? "auth_rejected"
              : generate.status >= 500
                ? "upstream_unavailable"
                : generate.ok
                  ? "endpoint_ok"
                  : "unexpected_status",
    },
  };

  console.info("[hermes.probe]", JSON.stringify(result));

  return Response.json({ data: result });
}
