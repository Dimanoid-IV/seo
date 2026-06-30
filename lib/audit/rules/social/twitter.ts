import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Twitter Card tags. */
export function checkTwitterCardExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.twitterCard.exists) {
    return createRuleResult({
      config: RuleConfig.TWITTER_CARD_PRESENT,
      status: Status.PASS,
      title: "Настроены Twitter/X карточки",
      description: "Twitter Card теги найдены.",
      whyItMatters: "Красивое превью повышает клики при публикации ссылки в X/Twitter.",
      recommendation: "Проверьте карточку в Twitter Card Validator.",
    });
  }

  return createRuleResult({
    config: RuleConfig.TWITTER_CARD_MISSING,
    status: Status.WARNING,
    title: "Нет настроек для Twitter/X",
    description: "Twitter Card теги не найдены.",
    whyItMatters: "Без twitter:card превью ссылки может быть некрасивым или пустым.",
    recommendation:
      "Добавьте twitter:card, twitter:title и twitter:description (можно дублировать OG).",
  });
}
