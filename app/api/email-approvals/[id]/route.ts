import { EmailApprovalStatus } from "@prisma/client";
import { z } from "zod";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
  validationErrorFromZod,
} from "@/lib/auth/responses";
import { getEmailApprovalById } from "@/lib/email-approvals/get-email-approvals";
import {
  archiveEmailApproval,
  updateEmailApproval,
} from "@/lib/email-approvals/update-email-approval";
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
  subject: z.string().min(1).max(500).optional(),
  body: z.string().min(1).max(20000).optional(),
  recipientEmail: z.string().email().nullable().optional(),
  language: z.string().max(10).nullable().optional(),
  status: z.enum(["DRAFT", "READY", "APPROVED"]).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;

    const email = await getEmailApprovalById({
      emailApprovalId: id,
      userId: currentUser.id,
    });

    if (!email) {
      throw new AppError(ErrorCode.NOT_FOUND, "Email approval not found");
    }

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;
    const body = await parseJsonBody(request);
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      throw validationErrorFromZod(parsed.error);
    }

    const email = await updateEmailApproval({
      emailApprovalId: id,
      userId: currentUser.id,
      data: {
        subject: parsed.data.subject,
        body: parsed.data.body,
        recipientEmail: parsed.data.recipientEmail,
        language: parsed.data.language,
        status: parsed.data.status as EmailApprovalStatus | undefined,
      },
    });

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;

    const email = await archiveEmailApproval({
      emailApprovalId: id,
      userId: currentUser.id,
    });

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
