import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Minimum visible text content on the page. */
export function checkWordCountMinimum(context: AuditRuleContext): AuditRuleResult {
  const { wordCount } = context.onPage;
  const minimum = 300;

  if (wordCount >= minimum) {
    return createRuleResult({
      config: RuleConfig.WORD_COUNT_OK,
      status: Status.PASS,
      title: "На странице достаточно текста для SEO",
      description: `Примерно ${wordCount} слов видимого текста.`,
      whyItMatters:
        "Объём текста помогает Google понять тему и релевантность запросам.",
      recommendation: "Дополняйте страницу полезными блоками: услуги, FAQ, отзывы.",
    });
  }

  const isVeryThin = wordCount < 150;

  return createRuleResult({
    config: isVeryThin ? RuleConfig.WORD_COUNT_VERY_LOW : RuleConfig.WORD_COUNT_LOW,
    status: isVeryThin ? Status.FAIL : Status.WARNING,
    title: isVeryThin
      ? "На странице слишком мало текста для продвижения"
      : "Контента на странице маловато для конкуренции в Google",
    description: `Примерно ${wordCount} слов (рекомендуем от ${minimum}).`,
    whyItMatters:
      "Тонкая страница редко ранжируется по конкурентным запросам — Google ищет полезный контент.",
    recommendation:
      "Добавьте описание услуг, преимущества, FAQ и призыв к действию — минимум 300–500 слов.",
    scoreImpact: isVeryThin ? 8 : 5,
    evidence: { wordCount, minimum },
  });
}
