import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Meta description length is reasonable. */
export function checkMetaDescriptionLength(
  context: AuditRuleContext
): AuditRuleResult {
  if (!context.onPage.metaDescription.exists) {
    return createRuleResult({
      config: RuleConfig.META_DESCRIPTION_LENGTH_NA,
      status: Status.NOT_APPLICABLE,
      title: "Длина описания не проверялась",
      description: "Meta description отсутствует.",
      whyItMatters: "Сначала добавьте описание страницы.",
      recommendation: "Создайте meta description, затем проверьте длину.",
    });
  }

  const length = context.onPage.metaDescription.length;

  if (length >= 70 && length <= 160) {
    return createRuleResult({
      config: RuleConfig.META_DESCRIPTION_LENGTH_OK,
      status: Status.PASS,
      title: "Длина описания подходит для Google",
      description: `${length} символов (рекомендуем 70–160).`,
      whyItMatters: "Описание полностью помещается в сниппет и привлекает клики.",
      recommendation: "Сохраните текущий объём или улучшите формулировку.",
    });
  }

  const tooShort = length < 70;

  return createRuleResult({
    config: tooShort
      ? RuleConfig.META_DESCRIPTION_TOO_SHORT
      : RuleConfig.META_DESCRIPTION_TOO_LONG,
    status: Status.WARNING,
    title: tooShort
      ? "Описание для Google слишком короткое"
      : "Описание может обрезаться в поиске",
    description: `${length} символов (рекомендуем 70–160).`,
    whyItMatters:
      "Короткое описание не раскрывает ценность; длинное — теряет концовку в выдаче.",
    recommendation: tooShort
      ? "Добавьте выгоду для клиента и призыв перейти на сайт."
      : "Уберите лишнее и оставьте 120–155 символов.",
    evidence: { length },
  });
}
