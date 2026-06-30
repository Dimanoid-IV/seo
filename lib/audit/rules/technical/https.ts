import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Site uses HTTPS in the final URL. */
export function checkHttps(context: AuditRuleContext): AuditRuleResult {
  const isHttps = context.scan.finalUrl.startsWith("https://");

  if (isHttps) {
    return createRuleResult({
      config: RuleConfig.HTTPS_PASS,
      status: Status.PASS,
      title: "Сайт открывается по защищённому HTTPS",
      description: "Страница загружена по протоколу HTTPS.",
      whyItMatters:
        "HTTPS повышает доверие посетителей и является базовым сигналом безопасности для Google.",
      recommendation: "Продолжайте использовать HTTPS на всех страницах сайта.",
    });
  }

  return createRuleResult({
    config: RuleConfig.HTTPS_MISSING,
    status: Status.FAIL,
    title: "Сайт открывается без защищённого соединения",
    description: "Финальный URL использует HTTP вместо HTTPS.",
    whyItMatters:
      "Браузеры помечают такие сайты как менее безопасные, а Google предпочитает HTTPS-версии.",
    recommendation:
      "Подключите SSL-сертификат и настройте автоматический редирект с HTTP на HTTPS.",
    evidence: { finalUrl: context.scan.finalUrl },
  });
}
