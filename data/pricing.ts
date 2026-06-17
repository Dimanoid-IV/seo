import type { Locale } from "@/i18n/config";

export type PricingPlan = {
  id: string;
  name: Record<Locale, string>;
  price: Record<Locale, string>;
  period: Record<Locale, string>;
  description: Record<Locale, string>;
  features: Record<Locale, string[]>;
  highlighted?: boolean;
  cta: Record<Locale, string>;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "start",
    name: {
      ru: "Start SEO",
      et: "Start SEO",
      en: "Start SEO",
    },
    price: {
      ru: "от 199 €",
      et: "alates 199 €",
      en: "from €199",
    },
    period: {
      ru: "/ мес",
      et: "/ kuus",
      en: "/ mo",
    },
    description: {
      ru: "Для небольших сайтов и локального бизнеса",
      et: "Väikestele veebilehtedele ja kohalikele ettevõtetele",
      en: "For small websites and local businesses",
    },
    features: {
      ru: [
        "Базовый SEO-аудит",
        "Проверка индексации",
        "До 5 страниц оптимизации",
        "2 SEO-статьи в месяц",
        "Базовые рекомендации",
        "Email-поддержка",
      ],
      et: [
        "Baas SEO audit",
        "Indekseerimise kontroll",
        "Kuni 5 optimeeritavat lehte",
        "2 SEO artiklit kuus",
        "Baassoovitused",
        "E-posti tugi",
      ],
      en: [
        "Basic SEO audit",
        "Indexing check",
        "Up to 5 optimized pages",
        "2 SEO articles per month",
        "Basic recommendations",
        "Email support",
      ],
    },
    cta: {
      ru: "Заказать план",
      et: "Telli pakett",
      en: "Order Plan",
    },
  },
  {
    id: "local-boost",
    name: {
      ru: "Local Boost",
      et: "Local Boost",
      en: "Local Boost",
    },
    price: {
      ru: "от 349 €",
      et: "alates 349 €",
      en: "from €349",
    },
    period: {
      ru: "/ мес",
      et: "/ kuus",
      en: "/ mo",
    },
    description: {
      ru: "Для локального бизнеса в Эстонии",
      et: "Kohalikele ettevõtetele Eestis",
      en: "For local businesses in Estonia",
    },
    features: {
      ru: [
        "Все из Start SEO",
        "Google Business Profile оптимизация",
        "Локальные ключевые слова",
        "До 10 страниц оптимизации",
        "4 SEO-статьи в месяц",
        "Работа с локальными посадочными страницами",
        "Ежемесячный отчёт",
      ],
      et: [
        "Kõik Start SEO paketist",
        "Google Business Profile optimeerimine",
        "Kohalikud märksõnad",
        "Kuni 10 optimeeritavat lehte",
        "4 SEO artiklit kuus",
        "Kohalike maandumislehtede arendus",
        "Igakuine raport",
      ],
      en: [
        "Everything in Start SEO",
        "Google Business Profile optimization",
        "Local keywords",
        "Up to 10 optimized pages",
        "4 SEO articles per month",
        "Local landing page work",
        "Monthly report",
      ],
    },
    highlighted: true,
    cta: {
      ru: "Заказать план",
      et: "Telli pakett",
      en: "Order Plan",
    },
  },
  {
    id: "growth",
    name: {
      ru: "Growth SEO",
      et: "Growth SEO",
      en: "Growth SEO",
    },
    price: {
      ru: "от 599 €",
      et: "alates 599 €",
      en: "from €599",
    },
    period: {
      ru: "/ мес",
      et: "/ kuus",
      en: "/ mo",
    },
    description: {
      ru: "Для растущих сайтов и интернет-магазинов",
      et: "Kasvavatele veebilehtedele ja e-poodidele",
      en: "For growing websites and ecommerce stores",
    },
    features: {
      ru: [
        "Полный SEO-аудит",
        "Техническое SEO",
        "До 25 страниц оптимизации",
        "8 SEO-статей в месяц",
        "Контент-план",
        "Внутренняя перелинковка",
        "Анализ конкурентов",
        "Ежемесячный отчёт и план задач",
      ],
      et: [
        "Täielik SEO audit",
        "Tehniline SEO",
        "Kuni 25 optimeeritavat lehte",
        "8 SEO artiklit kuus",
        "Sisuplaan",
        "Sisemine linkimine",
        "Konkurentide analüüs",
        "Igakuine raport ja tegevusplaan",
      ],
      en: [
        "Full SEO audit",
        "Technical SEO",
        "Up to 25 optimized pages",
        "8 SEO articles per month",
        "Content plan",
        "Internal linking",
        "Competitor analysis",
        "Monthly report and task plan",
      ],
    },
    cta: {
      ru: "Заказать план",
      et: "Telli pakett",
      en: "Order Plan",
    },
  },
  {
    id: "partner",
    name: {
      ru: "SEO Partner",
      et: "SEO Partner",
      en: "SEO Partner",
    },
    price: {
      ru: "индивидуально",
      et: "individuaalne",
      en: "custom",
    },
    period: {
      ru: "",
      et: "",
      en: "",
    },
    description: {
      ru: "Для компаний, которым нужен постоянный SEO-партнер",
      et: "Ettevõtetele, kes vajavad püsivat SEO partnerit",
      en: "For companies that need a long-term SEO partner",
    },
    features: {
      ru: [
        "Полная SEO-стратегия",
        "Мультиязычное SEO",
        "SEO для нескольких стран",
        "Расширенная аналитика",
        "Приоритетная поддержка",
        "Постоянная работа над ростом органики",
        "Индивидуальный план",
      ],
      et: [
        "Täielik SEO strateegia",
        "Mitmekeelne SEO",
        "SEO mitme riigi jaoks",
        "Laiendatud analüütika",
        "Prioriteetne tugi",
        "Pidev töö orgaanilise kasvu nimel",
        "Individuaalne plaan",
      ],
      en: [
        "Full SEO strategy",
        "Multilingual SEO",
        "SEO for multiple countries",
        "Advanced analytics",
        "Priority support",
        "Continuous organic growth work",
        "Custom plan",
      ],
    },
    cta: {
      ru: "Заказать план",
      et: "Telli pakett",
      en: "Order Plan",
    },
  },
];

export const pricingComparison = {
  headers: {
    ru: ["Функция", "Start SEO", "Local Boost", "Growth SEO", "SEO Partner"],
    et: ["Funktsioon", "Start SEO", "Local Boost", "Growth SEO", "SEO Partner"],
    en: ["Feature", "Start SEO", "Local Boost", "Growth SEO", "SEO Partner"],
  },
  rows: [
    {
      feature: {
        ru: "SEO-аудит",
        et: "SEO audit",
        en: "SEO audit",
      },
      values: [true, true, true, true],
    },
    {
      feature: {
        ru: "Google Business Profile",
        et: "Google Business Profile",
        en: "Google Business Profile",
      },
      values: [false, true, true, true],
    },
    {
      feature: {
        ru: "Оптимизация страниц",
        et: "Lehtede optimeerimine",
        en: "Page optimization",
      },
      values: ["5", "10", "25", "∞"],
    },
    {
      feature: {
        ru: "SEO-статей в месяц",
        et: "SEO artikleid kuus",
        en: "SEO articles per month",
      },
      values: ["2", "4", "8", "∞"],
    },
    {
      feature: {
        ru: "Техническое SEO",
        et: "Tehniline SEO",
        en: "Technical SEO",
      },
      values: [false, false, true, true],
    },
    {
      feature: {
        ru: "Ежемесячный отчёт",
        et: "Igakuine raport",
        en: "Monthly report",
      },
      values: [false, true, true, true],
    },
    {
      feature: {
        ru: "Мультиязычное SEO",
        et: "Mitmekeelne SEO",
        en: "Multilingual SEO",
      },
      values: [false, false, false, true],
    },
    {
      feature: {
        ru: "Приоритетная поддержка",
        et: "Prioriteetne tugi",
        en: "Priority support",
      },
      values: [false, false, false, true],
    },
  ],
};
