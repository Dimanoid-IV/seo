import type { GscInsight, GscMetricsSummary } from "@/lib/integrations/gsc-types";

const MAX_INSIGHTS = 5;

type InsightRule = {
  code: string;
  type: GscInsight["type"];
  matches: (metrics: GscMetricsSummary) => boolean;
  title: string;
  description: string;
  recommendation: string;
};

const INSIGHT_RULES: InsightRule[] = [
  {
    code: "no_impressions",
    type: "warning",
    matches: ({ impressions }) => impressions === 0,
    title: "Google пока почти не показывает сайт",
    description:
      "За последние 28 дней в поиске Google почти не было показов ваших страниц. Это значит, что сайт пока слабо заметен для потенциальных клиентов.",
    recommendation:
      "Начните с базовых SEO-задач и добавления контента.",
  },
  {
    code: "impressions_no_clicks",
    type: "warning",
    matches: ({ impressions, clicks }) => impressions > 0 && clicks === 0,
    title: "Сайт уже показывается, но по нему не кликают",
    description:
      "Люди видят ваш сайт в результатах Google, но пока не переходят на него. Показы есть — интерес пока не превращается в визиты.",
    recommendation:
      "Улучшите заголовки страниц и meta description.",
  },
  {
    code: "low_ctr",
    type: "warning",
    matches: ({ ctr, impressions }) => ctr < 0.01 && impressions > 100,
    title: "Низкий CTR",
    description:
      "Доля переходов из показов ниже обычного. Сайт появляется в поиске, но заголовок и описание в Google не убеждают нажать.",
    recommendation:
      "Сделайте заголовки в Google более привлекательными.",
  },
  {
    code: "far_positions",
    type: "opportunity",
    matches: ({ position, impressions }) => position > 20 && impressions > 50,
    title: "Сайт виден, но пока далеко от первых результатов",
    description:
      "Страницы уже попадают в выдачу, но в среднем стоят далеко от первой страницы. Клиенты реже доходят до вашего сайта.",
    recommendation:
      "Добавьте контент и улучшите страницы, которые уже получают показы.",
  },
  {
    code: "strong_positions",
    type: "positive",
    matches: ({ position, clicks }) => position <= 10 && clicks > 0,
    title: "Есть первые сильные позиции",
    description:
      "Часть запросов уже приносит клики с хороших позиций. Google начал доверять отдельным страницам вашего сайта.",
    recommendation:
      "Усильте страницы, которые уже работают.",
  },
  {
    code: "meaningful_traffic",
    type: "positive",
    matches: ({ clicks }) => clicks > 20,
    title: "Google уже приводит посетителей",
    description:
      "За последние 28 дней с поиска пришло заметное число переходов. Это реальный канал привлечения, а не только потенциал.",
    recommendation:
      "Следите за ростом и расширяйте контент.",
  },
];

/**
 * Generates up to 5 rule-based insights from GSC summary metrics (no AI).
 */
export function generateGscInsights(
  metricsSummary: GscMetricsSummary
): GscInsight[] {
  const insights: GscInsight[] = [];

  for (const rule of INSIGHT_RULES) {
    if (!rule.matches(metricsSummary)) {
      continue;
    }

    insights.push({
      code: rule.code,
      type: rule.type,
      title: rule.title,
      description: rule.description,
      recommendation: rule.recommendation,
    });

    if (insights.length >= MAX_INSIGHTS) {
      break;
    }
  }

  return insights;
}

export const GSC_METRICS_EXPLAINER = [
  {
    label: "Клики",
    text: "Сколько раз люди перешли на сайт из Google за выбранный период.",
  },
  {
    label: "Показы",
    text: "Сколько раз страницы сайта появились в результатах поиска.",
  },
  {
    label: "CTR",
    text: "Доля переходов из показов — насколько часто кликают, когда сайт виден.",
  },
  {
    label: "Средняя позиция",
    text: "На какой строке в среднем показывается сайт. Чем ближе к 1, тем выше в списке.",
  },
] as const;
