import { TaskStatus } from "@prisma/client";

import { requireUser } from "@/lib/auth/current-user";
import {
  authErrorResponse,
  authJsonResponse,
  parseJsonBody,
} from "@/lib/auth/responses";
import { getServerEnv } from "@/lib/env";
import { AppError, ErrorCode } from "@/lib/errors";
import { updateTaskStatus } from "@/lib/tasks/task-actions";

function assertDatabaseConfigured(): void {
  if (!getServerEnv().DATABASE_URL) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "База данных не настроена. Установите DATABASE_URL.",
      { statusCode: 503 }
    );
  }
}

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

function parseTaskStatus(value: unknown): TaskStatus {
  if (typeof value !== "string") {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Укажите status", {
      details: { field: "status" },
    });
  }

  const normalized = value.toUpperCase();
  if (!Object.values(TaskStatus).includes(normalized as TaskStatus)) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, "Недопустимый статус задачи", {
      details: { status: value },
    });
  }

  return normalized as TaskStatus;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertDatabaseConfigured();

    const currentUser = await requireUser(request);
    const { taskId } = await context.params;
    const body = (await parseJsonBody(request)) as { status?: unknown };
    const status = parseTaskStatus(body.status);

    const task = await updateTaskStatus({
      taskId,
      status,
      currentUser,
    });

    return authJsonResponse({ data: task });
  } catch (error) {
    return authErrorResponse(request, error);
  }
}
