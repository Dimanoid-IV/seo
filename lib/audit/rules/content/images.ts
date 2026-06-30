import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Image alt text coverage. */
export function checkImageAltCoverage(context: AuditRuleContext): AuditRuleResult {
  const { total, missingAlt, emptyAlt, withAlt } = context.onPage.images;

  if (total === 0) {
    return createRuleResult({
      config: RuleConfig.IMAGES_NONE,
      status: Status.NOT_APPLICABLE,
      title: "На странице нет изображений",
      description: "Проверка alt-текстов не требуется.",
      whyItMatters: "Нет изображений — нет проблем с alt.",
      recommendation: "При добавлении фото указывайте описательный alt.",
    });
  }

  const problemCount = missingAlt + emptyAlt;
  const coverage = withAlt / total;

  if (coverage >= 0.8) {
    return createRuleResult({
      config: RuleConfig.IMAGE_ALT_GOOD,
      status: Status.PASS,
      title: "У большинства фото есть описания",
      description: `${withAlt} из ${total} изображений с alt-текстом.`,
      whyItMatters:
        "Alt помогает людям с ограниченным зрением и Google понимать содержание фото.",
      recommendation: "Добавьте alt к оставшимся изображениям.",
    });
  }

  return createRuleResult({
    config: RuleConfig.IMAGE_ALT_WEAK,
    status: Status.WARNING,
    title: "У части фото нет текстового описания",
    description: `${problemCount} из ${total} изображений без нормального alt.`,
    whyItMatters:
      "Google не «видит» картинки как люди — alt объясняет, что на фото, и помогает в поиске по картинкам.",
    recommendation:
      "Добавьте короткий alt к каждому значимому изображению (услуга, команда, интерьер).",
    evidence: { total, missingAlt, emptyAlt, withAlt },
  });
}
