import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** JSON-LD structured data exists. */
export function checkSchemaExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.schema.jsonLdCount > 0) {
    return createRuleResult({
      config: RuleConfig.SCHEMA_PRESENT,
      status: Status.PASS,
      title: "На странице есть структурированные данные",
      description: `JSON-LD блоков: ${context.onPage.schema.jsonLdCount}.`,
      whyItMatters:
        "Schema помогает Google и AI-системам понимать тип бизнеса и контент страницы.",
      recommendation: "Расширяйте schema по мере добавления FAQ, услуг и отзывов.",
    });
  }

  return createRuleResult({
    config: RuleConfig.SCHEMA_MISSING,
    status: Status.WARNING,
    title: "Google и AI-системы хуже понимают тип вашего бизнеса",
    description: "JSON-LD разметка не найдена.",
    whyItMatters:
      "Структурированные данные повышают шанс rich results и цитирования в AI-поиске.",
    recommendation:
      "Добавьте JSON-LD Organization или LocalBusiness через CMS или плагин.",
  });
}
