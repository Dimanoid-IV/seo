import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** HTTP status code is successful (200). */
export function checkStatusCode(context: AuditRuleContext): AuditRuleResult {
  const { statusCode } = context.scan;

  if (statusCode >= 200 && statusCode < 300) {
    return createRuleResult({
      config: RuleConfig.STATUS_CODE_OK,
      status: Status.PASS,
      title: "Страница отвечает успешно",
      description: `Сервер вернул код ${statusCode}.`,
      whyItMatters:
        "Поисковые системы должны получать успешный ответ, чтобы проиндексировать страницу.",
      recommendation: "Ничего делать не нужно — страница доступна.",
    });
  }

  return createRuleResult({
    config: RuleConfig.STATUS_CODE_ERROR,
    status: Status.FAIL,
    title: "Страница возвращает ошибку сервера",
    description: `Сервер вернул код ${statusCode} вместо успешного ответа.`,
    whyItMatters:
      "Если Google видит ошибку, страница может выпасть из поиска или не попасть в индекс.",
    recommendation:
      "Проверьте настройки хостинга и убедитесь, что главная страница открывается без ошибок.",
    evidence: { statusCode },
  });
}
