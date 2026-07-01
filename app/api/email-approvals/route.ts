import {
  EmailApprovalStatus,
  EmailApprovalType,
} from "@prisma/client";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
} from "@/lib/auth/responses";
import { getEmailApprovals } from "@/lib/email-approvals/get-email-approvals";
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

export async function GET(request: Request) {
  try {
    assertDatabaseConfigured();
    const currentUser = await requireUser(request);
    const url = new URL(request.url);

    const statusParam = url.searchParams.get("status");
    const typeParam = url.searchParams.get("type");

    const result = await getEmailApprovals({
      userId: currentUser.id,
      organizationId: currentUser.organizationId,
      websiteId: url.searchParams.get("websiteId"),
      limit: url.searchParams.get("limit")
        ? Number.parseInt(url.searchParams.get("limit") ?? "20", 10)
        : undefined,
      cursor: url.searchParams.get("cursor"),
      ...(statusParam
        ? { status: statusParam.toUpperCase() as EmailApprovalStatus }
        : {}),
      ...(typeParam
        ? { type: typeParam.toUpperCase() as EmailApprovalType }
        : {}),
    });

    return authJsonResponse({ data: result });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
