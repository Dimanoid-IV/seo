import type { ScoreLabel } from "@/lib/audit/preview-response";

export const AUDIT_SCORE_LABELS: Record<ScoreLabel, string> = {
  poor: "Нужны срочные улучшения",
  needs_work: "Есть хороший потенциал роста",
  good: "Сайт в неплохом состоянии",
  strong: "Сильная база для роста",
};

export const AUDIT_LOADING_STEPS = [
  "Проверяем доступность сайта…",
  "Анализируем структуру страницы…",
  "Ищем главные препятствия для роста…",
  "Считаем Growth Score preview…",
] as const;

export const AUDIT_SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Критично",
  HIGH: "Высокий приоритет",
  MEDIUM: "Средний приоритет",
  LOW: "Низкий приоритет",
  INFO: "Информация",
};

type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      scannerError?: string;
    };
  };
};

/** Maps preview API errors to user-friendly Russian messages. */
export function getAuditPreviewErrorMessage(
  status: number,
  body: ApiErrorPayload
): string {
  const code = body.error?.code;
  const scannerError = body.error?.details?.scannerError;
  const serverMessage = body.error?.message;

  if (scannerError === "INVALID_URL") {
    return "Укажите корректный адрес сайта, например example.com или https://example.com";
  }
  if (scannerError === "SSRF_BLOCKED" || scannerError === "BLOCKED_HOST") {
    return "Этот адрес нельзя проверить по соображениям безопасности";
  }
  if (scannerError === "TIMEOUT" || status === 408) {
    return "Сайт отвечает слишком долго. Попробуйте позже или проверьте другой URL";
  }
  if (scannerError === "TOO_LARGE" || status === 413) {
    return "Страница слишком большая для бесплатной проверки";
  }
  if (scannerError === "UNSUPPORTED_CONTENT_TYPE" || status === 415) {
    return "По этому адресу нет HTML-страницы. Укажите URL главной страницы сайта";
  }
  if (
    scannerError === "WEBSITE_UNREACHABLE" ||
    scannerError === "DNS_FAILURE" ||
    scannerError === "SSL_FAILURE" ||
    status === 422
  ) {
    return "Не удалось открыть сайт. Проверьте адрес и убедитесь, что сайт доступен";
  }
  if (code === "VALIDATION_ERROR" && serverMessage) {
    return serverMessage;
  }
  if (status >= 500) {
    return "Сервис временно недоступен. Попробуйте через несколько минут";
  }

  return serverMessage ?? "Не удалось выполнить проверку. Попробуйте ещё раз";
}

export function formatFixMinutes(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} мин`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) {
    return `~${hours} ч`;
  }
  return `~${hours} ч ${rest} мин`;
}
