import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Canonical link is present. */
export function checkCanonicalExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.canonical.exists) {
    return createRuleResult({
      config: RuleConfig.CANONICAL_PRESENT,
      status: Status.PASS,
      title: "Указана каноническая версия страницы",
      description: `Canonical: ${context.onPage.canonical.href}`,
      whyItMatters:
        "Canonical помогает избежать дублей, если страница доступна по разным URL.",
      recommendation: "Проверьте, что canonical указывает на основной адрес страницы.",
    });
  }

  return createRuleResult({
    config: RuleConfig.CANONICAL_MISSING,
    status: Status.WARNING,
    title: "Не указана основная версия страницы",
    description: "Тег link rel=canonical отсутствует.",
    whyItMatters:
      "Без canonical Google может индексировать копии страницы (с www, без www, с параметрами).",
    recommendation: "Добавьте canonical на предпочитаемый URL этой страницы.",
  });
}
