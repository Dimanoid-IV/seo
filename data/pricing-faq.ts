import type { Locale } from "@/i18n/config";

export type FAQItem = {
  id: string;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
};

export const pricingFaqItems: FAQItem[] = [
  {
    id: "switch-plan",
    question: {
      ru: "Можно ли сменить тариф в процессе работы?",
      et: "Kas saan paketti töö käigus vahetada?",
      en: "Can I switch plans during the project?",
    },
    answer: {
      ru: "Да. Если ваш сайт вырос или задачи изменились, мы поможем перейти на более подходящий план. Апгрейд возможен в любой момент с пересчётом с начала следующего месяца.",
      et: "Jah. Kui teie veebileht on kasvanud või ülesanded on muutunud, aitame üle minna sobivamale paketile. Uuendamine on võimalik igal ajal järgmise kuu algusest.",
      en: "Yes. If your website has grown or goals changed, we'll help you move to a more suitable plan. Upgrades are possible anytime from the start of the next month.",
    },
  },
  {
    id: "minimum-term",
    question: {
      ru: "Какой минимальный срок подписки?",
      et: "Mis on minimaalne tellimisperiood?",
      en: "What is the minimum subscription period?",
    },
    answer: {
      ru: "Подписку можно отменить в любой момент по условиям биллинга в аккаунте. SEO требует времени — первые измеримые изменения обычно видны через несколько недель регулярной работы, но позиции не гарантируются.",
      et: "Tellimuse saab tühistada igal ajal vastavalt konto arveldustingimustele. SEO vajab aega — esimesed mõõdetavad muutused ilmnevad tavaliselt mõne nädala jooksul, kuid positsioone ei garanteerita.",
      en: "You can cancel anytime per your account billing terms. SEO needs time — early measurable changes usually appear after weeks of consistent work, but rankings are not guaranteed.",
    },
  },
  {
    id: "vat",
    question: {
      ru: "Цены включают НДС?",
      et: "Kas hinnad sisaldavad KM-d?",
      en: "Do prices include VAT?",
    },
    answer: {
      ru: "Все указанные цены указаны без НДС. Для клиентов из Эстонии и ЕС НДС добавляется согласно законодательству. Для международных клиентов условия обсуждаются индивидуально.",
      et: "Kõik hinnad on ilma KM-ta. Eesti ja EL klientidele lisatakse KM vastavalt seadustele.",
      en: "All prices exclude VAT. VAT is added for Estonian and EU clients according to regulations.",
    },
  },
  {
    id: "custom-partner",
    question: {
      ru: "Как формируется цена SEO Partner?",
      et: "Kuidas kujuneb SEO Partner hind?",
      en: "How is SEO Partner pricing determined?",
    },
    answer: {
      ru: "SEO Partner — индивидуальный план. Цена зависит от количества языков, стран, объёма контента и сложности технической базы. После бесплатной консультации мы подготовим персональное предложение.",
      et: "SEO Partner on individuaalne plaan. Hind sõltub keelte arvust, riikidest, sisu mahust ja tehnilisest keerukusest.",
      en: "SEO Partner is a custom plan. Pricing depends on languages, countries, content volume, and technical complexity. We'll prepare a personal proposal after a free consultation.",
    },
  },
  {
    id: "payment",
    question: {
      ru: "Как происходит оплата?",
      et: "Kuidas toimub maksmine?",
      en: "How does payment work?",
    },
    answer: {
      ru: "Оплата ежемесячно по счёту в начале каждого периода. Принимаем банковский перевод. Для SEO Partner возможны индивидуальные условия оплаты.",
      et: "Maksmine toimub igakuiselt arve alusel perioodi alguses. Aktsepteerime pangaülekannet.",
      en: "Payment is monthly by invoice at the start of each period. We accept bank transfer. Custom payment terms available for SEO Partner.",
    },
  },
  {
    id: "results",
    question: {
      ru: "Когда будут первые результаты?",
      et: "Millal tulevad esimesed tulemused?",
      en: "When will I see first results?",
    },
    answer: {
      ru: "Технические улучшения — через 2–4 недели. Рост органического трафика — обычно через 3–6 месяцев. Local Boost часто показывает результаты в Google Maps быстрее — через 2–3 месяца.",
      et: "Tehnilised parandused — 2–4 nädala jooksul. Orgaanilise liikluse kasv — tavaliselt 3–6 kuu jooksul.",
      en: "Technical improvements within 2–4 weeks. Organic traffic growth typically within 3–6 months. Local Boost often shows Google Maps results faster — within 2–3 months.",
    },
  },
];
