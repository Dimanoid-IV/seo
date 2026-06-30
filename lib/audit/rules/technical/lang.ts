import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** HTML lang attribute is set. */
export function checkHtmlLangExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.lang.exists) {
    return createRuleResult({
      config: RuleConfig.HTML_LANG_PRESENT,
      status: Status.PASS,
      title: "Указан язык страницы",
      description: `lang="${context.onPage.lang.htmlLang}"`,
      whyItMatters:
        "Язык помогает Google и screen reader показывать страницу правильной аудитории.",
      recommendation: "Убедитесь, что lang соответствует основному языку контента.",
    });
  }

  return createRuleResult({
    config: RuleConfig.HTML_LANG_MISSING,
    status: Status.WARNING,
    title: "Не указан язык страницы",
    description: "Атрибут lang у тега html отсутствует.",
    whyItMatters:
      "Без lang поисковик и браузер могут неверно определить язык — особенно для ru/et/en сайтов.",
    recommendation: 'Добавьте lang="ru", lang="et" или lang="en" на тег <html>.',
  });
}
