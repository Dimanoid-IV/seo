import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import { approveEmailApproval } from "@/lib/email-approvals/update-email-approval";
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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const { id } = await context.params;

    const email = await approveEmailApproval({
      emailApprovalId: id,
      userId: currentUser.id,
    });

    return authJsonResponse({ data: email });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
