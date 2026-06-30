import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Organization or LocalBusiness schema. */
export function checkOrganizationOrLocalBusinessSchema(
  context: AuditRuleContext
): AuditRuleResult {
  const { hasOrganization, hasLocalBusiness } = context.onPage.schema;

  if (hasOrganization || hasLocalBusiness) {
    return createRuleResult({
      config: RuleConfig.BUSINESS_SCHEMA_PRESENT,
      status: Status.PASS,
      title: "Указаны данные о бизнесе для Google",
      description: hasLocalBusiness
        ? "LocalBusiness schema найдена."
        : "Organization schema найдена.",
      whyItMatters: "Разметка компании помогает локальному SEO и Knowledge Panel.",
      recommendation: "Добавьте адрес, телефон и часы работы в schema.",
    });
  }

  return createRuleResult({
    config: RuleConfig.BUSINESS_SCHEMA_MISSING,
    status: Status.WARNING,
    title: "Google не видит структурированные данные о компании",
    description: "Organization / LocalBusiness schema не найдена.",
    whyItMatters:
      "Для локального бизнеса разметка помогает показываться в Maps и локальной выдаче.",
    recommendation: "Добавьте LocalBusiness JSON-LD с названием, адресом и телефоном.",
  });
}
