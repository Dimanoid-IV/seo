import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Viewport meta tag for mobile. */
export function checkViewportExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.viewport.exists) {
    return createRuleResult({
      config: RuleConfig.VIEWPORT_PRESENT,
      status: Status.PASS,
      title: "Страница адаптирована под мобильные",
      description: "Meta viewport настроен.",
      whyItMatters: "Большинство клиентов заходят с телефона — viewport обязателен.",
      recommendation: "Проверьте отображение сайта на смартфоне вручную.",
    });
  }

  return createRuleResult({
    config: RuleConfig.VIEWPORT_MISSING,
    status: Status.FAIL,
    title: "Сайт может плохо выглядеть на телефоне",
    description: "Meta viewport отсутствует.",
    whyItMatters:
      "Google использует mobile-first индексацию: без viewport страница кажется «десктопной» на телефоне.",
    recommendation:
      'Добавьте <meta name="viewport" content="width=device-width, initial-scale=1">.',
  });
}
