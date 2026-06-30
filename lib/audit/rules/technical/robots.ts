import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Page is not blocked by robots noindex. */
export function checkRobotsNoindex(context: AuditRuleContext): AuditRuleResult {
  if (!context.onPage.robotsMeta.noindex) {
    return createRuleResult({
      config: RuleConfig.ROBOTS_INDEXABLE,
      status: Status.PASS,
      title: "Страница не закрыта от индексации",
      description: "Meta robots не содержит noindex.",
      whyItMatters: "Открытая для индексации страница может появляться в Google.",
      recommendation: "Не добавляйте noindex на важные коммерческие страницы.",
    });
  }

  return createRuleResult({
    config: RuleConfig.ROBOTS_NOINDEX,
    status: Status.FAIL,
    title: "Страница скрыта от Google",
    description: `Meta robots: ${context.onPage.robotsMeta.content ?? "noindex"}`,
    whyItMatters:
      "С директивой noindex страница не попадёт в поиск — клиенты не найдут вас через Google.",
    recommendation: "Уберите noindex с этой страницы, если она должна привлекать клиентов.",
  });
}
