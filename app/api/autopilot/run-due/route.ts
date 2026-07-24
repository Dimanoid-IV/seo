import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { runScheduledAutopilotPlans } from "@/lib/autopilot/run-scheduled-plan";
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

const postSchema = z.object({
  dryRun: z.boolean().optional(),
  websiteId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);
    let body: unknown = {};
    try {
      body = await parseJsonBody(request);
    } catch {
      body = {};
    }
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const queryDryRun = url.searchParams.get("dryRun") === "true";

    const report = await runScheduledAutopilotPlans({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: parsed.data.websiteId,
      dryRun: queryDryRun || parsed.data.dryRun === true,
    });

    return authJsonResponse({ data: report });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
