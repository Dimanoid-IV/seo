import type { Locale } from "@/i18n/config";

export type FAQItem = {
  id: string;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
};

export const faqItems: FAQItem[] = [
  {
    id: "timeline",
    question: {
      ru: "Когда будут первые результаты SEO?",
      et: "Millal tulevad esimesed SEO tulemused?",
      en: "When will I see first SEO results?",
    },
    answer: {
      ru: "Первые улучшения индексации и технических показателей — через 2–4 недели. Заметный рост органического трафика обычно наступает через 3–6 месяцев при регулярной работе. SEO — это марафон, а не спринт.",
      et: "Esimesed indekseerimise ja tehniliste näitajate parandused — 2–4 nädala jooksul. Märgatav orgaanilise liikluse kasv tuleb tavaliselt 3–6 kuu jooksul järjepideva töö korral. SEO on maraton, mitte sprint.",
      en: "First indexing and technical improvements appear within 2–4 weeks. Noticeable organic traffic growth typically occurs within 3–6 months with consistent work. SEO is a marathon, not a sprint.",
    },
  },
  {
    id: "guarantee",
    question: {
      ru: "Даёте ли вы гарантию топ-1 в Google?",
      et: "Kas annate garantii Google top-1 positsioonile?",
      en: "Do you guarantee #1 on Google?",
    },
    answer: {
      ru: "Честный ответ: никто не может гарантировать конкретную позицию — алгоритмы Google постоянно меняются. Мы гарантируем прозрачную работу, измеримые KPI и рост ключевых метрик: трафик, видимость, конверсии.",
      et: "Aus vastus: keegi ei saa garanteerida konkreetset positsiooni — Google algoritmid muutuvad pidevalt. Garanteerime läbipaistva töö, mõõdetavad KPI-d ja võtmenäitajate kasvu: liiklus, nähtavus, konversioonid.",
      en: "Honest answer: no one can guarantee a specific ranking — Google algorithms change constantly. We guarantee transparent work, measurable KPIs, and growth in key metrics: traffic, visibility, conversions.",
    },
  },
  {
    id: "contract",
    question: {
      ru: "Нужен ли долгосрочный контракт?",
      et: "Kas vajalik on pikaajaline leping?",
      en: "Is a long-term contract required?",
    },
    answer: {
      ru: "Минимальный срок сопровождения — 3 месяца. Это оптимальный период для оценки эффективности SEO-стратегии. SEO-аудит — разовая услуга без обязательств.",
      et: "Minimaalne tugiperiood on 3 kuud. See on optimaalne periood SEO-strateegia efektiivsuse hindamiseks. SEO audit on ühekordne teenus ilma kohustusteta.",
      en: "Minimum support period is 3 months. This is the optimal timeframe to evaluate SEO strategy effectiveness. SEO audit is a one-time service with no obligations.",
    },
  },
  {
    id: "languages",
    question: {
      ru: "Работаете ли вы с многоязычными сайтами?",
      et: "Kas töötate mitmekeelsete veebilehtedega?",
      en: "Do you work with multilingual websites?",
    },
    answer: {
      ru: "Да. Мы специализируемся на многоязычном SEO: правильная hreflang-разметка, локализованные URL, контент на русском, эстонском и английском. Это наш основной рынок — Эстония и Европа.",
      et: "Jah. Spetsialiseerume mitmekeelsele SEO-le: õige hreflang-märgistus, lokaliseeritud URL-id, sisu eesti, vene ja inglise keeles. Meie peamine turg on Eesti ja Euroopa.",
      en: "Yes. We specialize in multilingual SEO: proper hreflang markup, localized URLs, content in Russian, Estonian, and English. Our primary market is Estonia and Europe.",
    },
  },
  {
    id: "reporting",
    question: {
      ru: "Как выглядит отчётность?",
      et: "Kuidas aruandlus välja näeb?",
      en: "What does reporting look like?",
    },
    answer: {
      ru: "Ежемесячный отчёт включает: динамику позиций, органический трафик, выполненные работы, план на следующий месяц. Доступ к Google Search Console и Analytics предоставляется клиенту.",
      et: "Igakuine aruanne sisaldab: positsioonide dünaamikat, orgaanilist liiklust, tehtud töid, plaani järgmiseks kuuks. Juurdepääs Google Search Console'ile ja Analyticsile antakse kliendile.",
      en: "Monthly report includes: ranking dynamics, organic traffic, completed work, plan for next month. Access to Google Search Console and Analytics is provided to the client.",
    },
  },
  {
    id: "cms",
    question: {
      ru: "С какими CMS вы работаете?",
      et: "Milliste CMS-idega töötate?",
      en: "Which CMS platforms do you work with?",
    },
    answer: {
      ru: "WordPress, Shopify, WooCommerce, Webflow, Next.js, custom-решения. Если у вас другая платформа — свяжитесь с нами, скорее всего мы с ней работали.",
      et: "WordPress, Shopify, WooCommerce, Webflow, Next.js, kohandatud lahendused. Kui teil on teine platvorm — võtke ühendust, tõenäoliselt oleme sellega töötanud.",
      en: "WordPress, Shopify, WooCommerce, Webflow, Next.js, custom solutions. If you have another platform — contact us, we've likely worked with it.",
    },
  },
];
