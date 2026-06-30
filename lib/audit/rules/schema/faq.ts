import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** FAQ schema for AI readiness. */
export function checkFAQSchema(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.schema.hasFAQ) {
    return createRuleResult({
      config: RuleConfig.FAQ_SCHEMA_PRESENT,
      status: Status.PASS,
      title: "Есть FAQ-разметка для поиска",
      description: "FAQPage / Question schema обнаружена.",
      whyItMatters: "FAQ часто попадает в расширенные результаты и ответы AI-поиска.",
      recommendation: "Обновляйте вопросы-ответы по реальным запросам клиентов.",
    });
  }

  return createRuleResult({
    config: RuleConfig.FAQ_SCHEMA_MISSING,
    status: Status.WARNING,
    title: "Нет FAQ-разметки для частых вопросов",
    description: "FAQPage schema не найдена.",
    whyItMatters:
      "Клиенты и AI ищут готовые ответы — FAQ повышает видимость по длинным запросам.",
    recommendation: "Добавьте блок FAQ на страницу и разметку FAQPage в JSON-LD.",
  });
}
