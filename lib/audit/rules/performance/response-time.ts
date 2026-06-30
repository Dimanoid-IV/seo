import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Server response time threshold. */
export function checkResponseTime(context: AuditRuleContext): AuditRuleResult {
  const { responseTimeMs } = context.scan;
  const warnMs = 3000;
  const failMs = 5000;

  if (responseTimeMs <= warnMs) {
    return createRuleResult({
      config: RuleConfig.RESPONSE_TIME_OK,
      status: Status.PASS,
      title: "Страница загружается достаточно быстро",
      description: `Время ответа сервера: ${responseTimeMs} мс.`,
      whyItMatters: "Быстрая загрузка снижает отказы и улучшает опыт на мобильных.",
      recommendation: "Следите за скоростью при добавлении новых блоков и скриптов.",
    });
  }

  if (responseTimeMs <= failMs) {
    return createRuleResult({
      config: RuleConfig.RESPONSE_TIME_SLOW,
      status: Status.WARNING,
      title: "Страница загружается медленнее, чем хотелось бы",
      description: `Время ответа: ${responseTimeMs} мс (норма до ${warnMs} мс).`,
      whyItMatters:
        "Медленный сайт теряет клиентов — многие уходят, не дождавшись загрузки.",
      recommendation:
        "Оптимизируйте хостинг, сжимайте изображения и включите кеширование.",
      evidence: { responseTimeMs, warnMs },
    });
  }

  return createRuleResult({
    config: RuleConfig.RESPONSE_TIME_CRITICAL,
    status: Status.FAIL,
    title: "Сайт загружается слишком долго",
    description: `Время ответа: ${responseTimeMs} мс (критично выше ${failMs} мс).`,
    whyItMatters:
      "Долгая загрузка напрямую бьёт по конверсии и может ухудшать позиции в Google.",
    recommendation:
      "Проверьте хостинг, CDN и тяжёлые скрипты; цель — ответ сервера до 2–3 секунд.",
    evidence: { responseTimeMs, failMs },
  });
}
