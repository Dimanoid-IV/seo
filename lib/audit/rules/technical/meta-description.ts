import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Meta description tag exists. */
export function checkMetaDescriptionExists(
  context: AuditRuleContext
): AuditRuleResult {
  if (context.onPage.metaDescription.exists) {
    return createRuleResult({
      config: RuleConfig.META_DESCRIPTION_PRESENT,
      status: Status.PASS,
      title: "Есть описание для сниппета в Google",
      description: "Meta description заполнен.",
      whyItMatters: "Описание помогает людям понять, зачем переходить на ваш сайт.",
      recommendation: "Обновляйте описание при изменении акций или услуг.",
    });
  }

  return createRuleResult({
    config: RuleConfig.META_DESCRIPTION_MISSING,
    status: Status.FAIL,
    title: "Google может показывать не самый удачный текст в результатах поиска",
    description: "Meta description отсутствует или пуст.",
    whyItMatters:
      "Без описания Google берёт случайный фрагмент со страницы — часто не про ваше главное предложение.",
    recommendation:
      "Напишите description на 120–155 символов: кому вы помогаете и почему стоит нажать.",
  });
}
