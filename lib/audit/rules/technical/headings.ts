import type { AuditRuleContext, AuditRuleResult } from "../../rules-types";
import { AuditRuleStatus as Status } from "../../rules-types";
import { createRuleResult, RuleConfig } from "../shared/create-result";

/** Page has exactly one H1 heading. */
export function checkSingleH1(context: AuditRuleContext): AuditRuleResult {
  const { count, texts } = context.onPage.h1;

  if (count === 1) {
    return createRuleResult({
      config: RuleConfig.H1_SINGLE,
      status: Status.PASS,
      title: "На странице один главный заголовок",
      description: `H1: «${texts[0] ?? ""}»`,
      whyItMatters: "Один H1 помогает Google понять главную тему страницы.",
      recommendation: "Сохраняйте один H1 на каждой важной landing-странице.",
    });
  }

  if (count === 0) {
    return createRuleResult({
      config: RuleConfig.H1_MISSING,
      status: Status.FAIL,
      title: "На странице нет главного заголовка",
      description: "Тег H1 не найден.",
      whyItMatters:
        "Без H1 поисковику сложнее понять, о чём страница — особенно для новых сайтов.",
      recommendation:
        "Добавьте один H1 с названием услуги или предложения в верхней части страницы.",
    });
  }

  return createRuleResult({
    config: RuleConfig.H1_MULTIPLE,
    status: Status.WARNING,
    title: "На странице несколько главных заголовков",
    description: `Найдено H1: ${count}.`,
    whyItMatters:
      "Несколько H1 размывают тему страницы — Google может хуже понять приоритет контента.",
    recommendation: "Оставьте один H1, остальные важные фразы перенесите в H2.",
    evidence: { count, samples: texts.slice(0, 3) },
  });
}
