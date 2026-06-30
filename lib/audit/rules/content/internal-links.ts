import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Minimum internal links for navigation and crawlability. */
export function checkInternalLinksMinimum(
  context: AuditRuleContext
): AuditRuleResult {
  const internal = context.onPage.links.internal;

  if (internal >= 3) {
    return createRuleResult({
      config: RuleConfig.INTERNAL_LINKS_OK,
      status: Status.PASS,
      title: "На странице есть внутренние ссылки",
      description: `Внутренних ссылок: ${internal}.`,
      whyItMatters:
        "Внутренние ссылки помогают посетителям и Google находить другие страницы сайта.",
      recommendation: "Ссылайтесь на услуги, контакты и важные разделы с главной.",
    });
  }

  return createRuleResult({
    config: RuleConfig.INTERNAL_LINKS_LOW,
    status: Status.WARNING,
    title: "Мало ссылок на другие страницы сайта",
    description: `Внутренних ссылок: ${internal} (рекомендуем минимум 3).`,
    whyItMatters:
      "Без внутренних ссылок Google хуже обходит сайт, а клиенты не находят нужные разделы.",
    recommendation:
      "Добавьте меню или блок ссылок на услуги, цены, контакты и блог.",
    evidence: { internal, total: context.onPage.links.total },
  });
}
