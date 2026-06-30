import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Title length is within a reasonable SEO range. */
export function checkTitleLength(context: AuditRuleContext): AuditRuleResult {
  if (!context.onPage.title.exists) {
    return createRuleResult({
      config: RuleConfig.TITLE_LENGTH_NA,
      status: Status.NOT_APPLICABLE,
      title: "Длина заголовка не проверялась",
      description: "Title отсутствует — проверка длины пропущена.",
      whyItMatters: "Сначала нужен сам заголовок страницы.",
      recommendation: "Добавьте title, затем проверьте его длину.",
    });
  }

  const length = context.onPage.title.length;

  if (length >= 30 && length <= 60) {
    return createRuleResult({
      config: RuleConfig.TITLE_LENGTH_OK,
      status: Status.PASS,
      title: "Длина заголовка в норме",
      description: `Title содержит ${length} символов (рекомендуем 30–60).`,
      whyItMatters: "Подходящая длина помогает полностью показать заголовок в Google.",
      recommendation: "Оставьте текущий формат или слегка улучшите формулировку.",
    });
  }

  const tooShort = length < 30;

  return createRuleResult({
    config: tooShort ? RuleConfig.TITLE_TOO_SHORT : RuleConfig.TITLE_TOO_LONG,
    status: Status.WARNING,
    title: tooShort
      ? "Заголовок слишком короткий для поиска"
      : "Заголовок может обрезаться в Google",
    description: `Title содержит ${length} символов (рекомендуем 30–60).`,
    whyItMatters:
      "Слишком короткий title упускает ключевые слова; длинный — обрезается в результатах поиска.",
    recommendation: tooShort
      ? "Добавьте город, услугу или преимущество в заголовок."
      : "Сократите title до 60 символов, оставив самое важное в начале.",
    evidence: { length, text: context.onPage.title.text },
  });
}
