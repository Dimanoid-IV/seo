import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import {
  getAutopilotSettings,
  parseAutopilotModeFromClient,
  updateAutopilotSettings,
} from "@/lib/autopilot/autopilot-settings";
import { getAutopilotStatusSnapshot } from "@/lib/autopilot/autopilot-status";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Database is not configured.",
      { statusCode: 503 }
    );
  }
}

const patchSchema = z.object({
  mode: z.string().min(1),
  websiteId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    const websiteId = url.searchParams.get("websiteId");

    const [settings, status] = await Promise.all([
      getAutopilotSettings({
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
        websiteId,
      }),
      getAutopilotStatusSnapshot({
        currentUser,
        websiteId,
      }),
    ]);

    return authJsonResponse({ data: { settings, status } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const body = await parseJsonBody(request);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const mode = parseAutopilotModeFromClient(parsed.data.mode);
    if (!mode) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid autopilot mode.");
    }

    const settings = await updateAutopilotSettings({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      mode,
    });

    const status = await getAutopilotStatusSnapshot({
      currentUser,
      websiteId: settings.websiteId,
    });

    return authJsonResponse({ data: { settings, status } });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
