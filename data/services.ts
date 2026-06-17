import type { Locale } from "@/i18n/config";

export type Service = {
  id: string;
  icon: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  features: Record<Locale, string[]>;
};

export const services: Service[] = [
  {
    id: "seo-audit",
    icon: "Search",
    title: {
      ru: "SEO-аудит",
      et: "SEO audit",
      en: "SEO Audit",
    },
    description: {
      ru: "Глубокий анализ вашего сайта: технические ошибки, контент, конкуренты и возможности роста. Получите приоритетный план действий на 3–6 месяцев.",
      et: "Põhjalik veebilehe analüüs: tehnilised vead, sisu, konkurendid ja kasvuvõimalused. Prioriteetne tegevusplaan 3–6 kuuks.",
      en: "Deep analysis of your website: technical issues, content, competitors, and growth opportunities. Get a prioritized action plan for 3–6 months.",
    },
    features: {
      ru: [
        "Технический аудит (100+ параметров)",
        "Анализ контента и ключевых слов",
        "Аудит конкурентов",
        "Проверка индексации и Core Web Vitals",
        "PDF-отчёт с приоритетами",
        "30-мин консультация",
      ],
      et: [
        "Tehniline audit (100+ parameetrit)",
        "Sisu ja märksõnade analüüs",
        "Konkurentide audit",
        "Indekseerimise ja Core Web Vitals kontroll",
        "PDF-aruanne prioriteetidega",
        "30-min konsultatsioon",
      ],
      en: [
        "Technical audit (100+ parameters)",
        "Content and keyword analysis",
        "Competitor audit",
        "Indexing and Core Web Vitals check",
        "PDF report with priorities",
        "30-min consultation",
      ],
    },
  },
  {
    id: "technical-seo",
    icon: "Settings",
    title: {
      ru: "Техническое SEO",
      et: "Tehniline SEO",
      en: "Technical SEO",
    },
    description: {
      ru: "Устраняем технические барьеры для индексации и ранжирования: скорость, структура, schema markup, мобильная версия и безопасность.",
      et: "Eemaldame tehnilised takistused indekseerimisele ja positsioneerimisele: kiirus, struktuur, schema markup, mobiiliversioon.",
      en: "Remove technical barriers to indexing and ranking: speed, structure, schema markup, mobile version, and security.",
    },
    features: {
      ru: [
        "Core Web Vitals оптимизация",
        "Schema markup и structured data",
        "Robots.txt, sitemap, canonical",
        "Исправление дублей и редиректов",
        "Мобильная оптимизация",
        "HTTPS и security headers",
      ],
      et: [
        "Core Web Vitals optimeerimine",
        "Schema markup ja structured data",
        "Robots.txt, sitemap, canonical",
        "Duplikaatide ja redirectide parandamine",
        "Mobiili optimeerimine",
        "HTTPS ja security headers",
      ],
      en: [
        "Core Web Vitals optimization",
        "Schema markup and structured data",
        "Robots.txt, sitemap, canonical",
        "Duplicate and redirect fixes",
        "Mobile optimization",
        "HTTPS and security headers",
      ],
    },
  },
  {
    id: "local-seo",
    icon: "MapPin",
    title: {
      ru: "Local SEO в Эстонии",
      et: "Kohalik SEO Eestis",
      en: "Local SEO in Estonia",
    },
    description: {
      ru: "Продвижение в Google Maps и локальной выдаче для бизнеса в Таллине, Тарту и по всей Эстонии. Оптимизация Google Business Profile.",
      et: "Google Maps ja kohaliku otsingu edendamine Tallinnas, Tartus ja kogu Eestis. Google Business Profile optimeerimine.",
      en: "Google Maps and local search promotion for businesses in Tallinn, Tartu, and across Estonia. Google Business Profile optimization.",
    },
    features: {
      ru: [
        "Google Business Profile оптимизация",
        "Локальные ключевые слова (RU/ET/EN)",
        "NAP-консистентность",
        "Локальные цитирования",
        "Оптимизация страниц услуг",
        "Работа с отзывами",
      ],
      et: [
        "Google Business Profile optimeerimine",
        "Kohalikud märksõnad (ET/RU/EN)",
        "NAP-järjepidevus",
        "Kohalikud tsitaadid",
        "Teenuselehtede optimeerimine",
        "Arvustuste haldamine",
      ],
      en: [
        "Google Business Profile optimization",
        "Local keywords (EN/ET/RU)",
        "NAP consistency",
        "Local citations",
        "Service page optimization",
        "Review management",
      ],
    },
  },
  {
    id: "ecommerce-seo",
    icon: "ShoppingCart",
    title: {
      ru: "SEO-продвижение интернет-магазинов",
      et: "E-poodide SEO",
      en: "E-commerce SEO",
    },
    description: {
      ru: "Продвижение каталогов, категорий и карточек товаров. Оптимизация для Shopify, WooCommerce и custom-решений.",
      et: "Kataloogide, kategooriate ja tootelehtede edendamine. Optimeerimine Shopify, WooCommerce ja custom lahendustele.",
      en: "Promotion of catalogs, categories, and product pages. Optimization for Shopify, WooCommerce, and custom solutions.",
    },
    features: {
      ru: [
        "Оптимизация категорий и фильтров",
        "SEO для карточек товаров",
        "Rich snippets (Product schema)",
        "Faceted navigation без дублей",
        "Внутренняя перелинковка каталога",
        "Контент для категорий",
      ],
      et: [
        "Kategooriate ja filtrite optimeerimine",
        "Tootelehtede SEO",
        "Rich snippets (Product schema)",
        "Faceted navigation ilma duplikaatideta",
        "Kataloogi sisemine linkimine",
        "Sisu kategooriatele",
      ],
      en: [
        "Category and filter optimization",
        "Product page SEO",
        "Rich snippets (Product schema)",
        "Faceted navigation without duplicates",
        "Catalog internal linking",
        "Category content",
      ],
    },
  },
  {
    id: "content-seo",
    icon: "FileText",
    title: {
      ru: "SEO-контент и статьи",
      et: "SEO sisu ja artiklid",
      en: "SEO Content & Articles",
    },
    description: {
      ru: "Создаём SEO-статьи и контент, который ранжируется в Google и приводит целевой трафик. Контент-стратегия под вашу нишу.",
      et: "Loome SEO-artikleid ja sisu, mis rankub Google'is ja toob sihtrühma. Sisustrateegia teie nišile.",
      en: "We create SEO articles and content that ranks on Google and drives targeted traffic. Content strategy for your niche.",
    },
    features: {
      ru: [
        "Контент-стратегия и календарь",
        "SEO-копирайтинг (RU/ET/EN)",
        "Оптимизация существующих страниц",
        "Информационные статьи и гайды",
        "Featured snippets оптимизация",
        "E-E-A-T сигналы",
      ],
      et: [
        "Sisustrateegia ja kalender",
        "SEO-kopeerimine (ET/RU/EN)",
        "Olemasolevate lehtede optimeerimine",
        "Infoartiklid ja juhendid",
        "Featured snippets optimeerimine",
        "E-E-A-T signaalid",
      ],
      en: [
        "Content strategy and calendar",
        "SEO copywriting (EN/ET/RU)",
        "Existing page optimization",
        "Informational articles and guides",
        "Featured snippets optimization",
        "E-E-A-T signals",
      ],
    },
  },
  {
    id: "multilingual-seo",
    icon: "Globe",
    title: {
      ru: "Мультиязычное SEO",
      et: "Mitmekeelne SEO",
      en: "Multilingual SEO",
    },
    description: {
      ru: "SEO для сайтов на русском, эстонском и английском. Hreflang, локализованные URL и контент для каждого рынка.",
      et: "SEO veebilehtedele eesti, vene ja inglise keeles. Hreflang, lokaliseeritud URL-id ja sisu iga turu jaoks.",
      en: "SEO for Russian, Estonian, and English websites. Hreflang, localized URLs, and content for each market.",
    },
    features: {
      ru: [
        "Hreflang-разметка",
        "Локализованные URL-структуры",
        "Ключевые слова на 3 языках",
        "Контент-локализация",
        "Мультиязычный sitemap",
        "Аудит языковых версий",
      ],
      et: [
        "Hreflang-märgistus",
        "Lokaliseeritud URL-struktuurid",
        "Märksõnad 3 keeles",
        "Sisu lokaliseerimine",
        "Mitmekeelne sitemap",
        "Keeleversioonide audit",
      ],
      en: [
        "Hreflang markup",
        "Localized URL structures",
        "Keywords in 3 languages",
        "Content localization",
        "Multilingual sitemap",
        "Language version audit",
      ],
    },
  },
  {
    id: "landing-pages",
    icon: "Layout",
    title: {
      ru: "Оптимизация посадочных страниц",
      et: "Maandumislehtede optimeerimine",
      en: "Landing Page Optimization",
    },
    description: {
      ru: "Оптимизируем посадочные страницы для конверсии и SEO: структура, заголовки, meta-теги, скорость и UX.",
      et: "Optimeerime maandumislehti konversiooni ja SEO jaoks: struktuur, pealkirjad, meta-sildid, kiirus ja UX.",
      en: "We optimize landing pages for conversion and SEO: structure, headings, meta tags, speed, and UX.",
    },
    features: {
      ru: [
        "SEO-оптимизация title и description",
        "Структура H1–H3 под ключевые слова",
        "Улучшение Core Web Vitals",
        "CTA и конверсионные элементы",
        "A/B рекомендации",
        "Schema markup для услуг",
      ],
      et: [
        "Title ja description SEO optimeerimine",
        "H1–H3 struktuur märksõnade jaoks",
        "Core Web Vitals parandamine",
        "CTA ja konversiooni elemendid",
        "A/B soovitused",
        "Schema markup teenustele",
      ],
      en: [
        "Title and description SEO optimization",
        "H1–H3 structure for keywords",
        "Core Web Vitals improvement",
        "CTA and conversion elements",
        "A/B recommendations",
        "Schema markup for services",
      ],
    },
  },
  {
    id: "new-sites",
    icon: "Rocket",
    title: {
      ru: "SEO для новых сайтов",
      et: "SEO uutele veebilehtedele",
      en: "SEO for New Websites",
    },
    description: {
      ru: "Запускаем SEO с нуля: правильная структура, техническая база и контент-стратегия с первого дня.",
      et: "Käivitame SEO nullist: õige struktuur, tehniline baas ja sisustrateegia esimesest päevast.",
      en: "Launch SEO from scratch: proper structure, technical foundation, and content strategy from day one.",
    },
    features: {
      ru: [
        "SEO-архитектура сайта",
        "Настройка Google Search Console",
        "Sitemap и robots.txt",
        "Базовая schema markup",
        "Стартовая семантика",
        "План контента на 6 месяцев",
      ],
      et: [
        "Veebilehe SEO-arhitektuur",
        "Google Search Console seadistamine",
        "Sitemap ja robots.txt",
        "Baas schema markup",
        "Algsemantika",
        "Sisuplaan 6 kuuks",
      ],
      en: [
        "Website SEO architecture",
        "Google Search Console setup",
        "Sitemap and robots.txt",
        "Basic schema markup",
        "Starter keyword research",
        "6-month content plan",
      ],
    },
  },
];

export function getServiceById(id: string): Service | undefined {
  return services.find((s) => s.id === id);
}
