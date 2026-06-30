import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Open Graph tags for social sharing. */
export function checkOpenGraphExists(context: AuditRuleContext): AuditRuleResult {
  if (context.onPage.openGraph.exists) {
    return createRuleResult({
      config: RuleConfig.OPEN_GRAPH_PRESENT,
      status: Status.PASS,
      title: "Страница готова к публикации в соцсетях",
      description: "Open Graph теги найдены.",
      whyItMatters:
        "При шаринге в Facebook/LinkedIn показывается красивая карточка с текстом и картинкой.",
      recommendation: "Проверьте превью ссылки в Facebook Sharing Debugger.",
    });
  }

  return createRuleResult({
    config: RuleConfig.OPEN_GRAPH_MISSING,
    status: Status.WARNING,
    title: "Ссылка на сайт может выглядеть бедно в соцсетях",
    description: "Open Graph теги не найдены.",
    whyItMatters: "Без OG при репосте соцсеть сама выберет случайный текст и картинку.",
    recommendation:
      "Добавьте og:title, og:description и og:image для главной и ключевых страниц.",
  });
}
