import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Page has a non-empty `<title>`. */
export function checkTitleExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.title.exists) {
    return createRuleResult({
      config: RuleConfig.TITLE_PRESENT,
      status: Status.PASS,
      title: "У страницы есть заголовок для поиска",
      description: `Title: «${context.onPage.title.text}»`,
      whyItMatters: "Заголовок — это первая строка, которую видят люди в Google.",
      recommendation:
        "Периодически проверяйте, что заголовок отражает услугу или предложение.",
    });
  }

  return createRuleResult({
    config: RuleConfig.TITLE_MISSING,
    status: Status.FAIL,
    title: "У страницы нет заголовка для Google",
    description: "Тег <title> пуст или отсутствует.",
    whyItMatters:
      "Без заголовка Google сам придумает текст для результатов поиска — часто неудачный.",
    recommendation:
      "Добавьте понятный title с названием бизнеса и главной услугой (50–60 символов).",
  });
}
