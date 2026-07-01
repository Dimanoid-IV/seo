import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { sendEmailApproval } from "@/lib/email-approvals/send-email-approval";
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

const sendSchema = z.object({
  recipientEmail: z.string().email().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const email = await sendEmailApproval({
      emailApprovalId: id,
      userId: currentUser.id,
      recipientEmail: parsed.data.recipientEmail,
    });

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
