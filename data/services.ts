import type { Locale } from "@/i18n/config";

export type Service = {
  id: string;
  icon: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  features: Record<Locale, string[]>;
};

/** Platform capabilities shown on the public product page. */
export const services: Service[] = [
  {
    id: "website-audit",
    icon: "Search",
    title: {
      en: "Website audit",
      ru: "Аудит сайта",
      et: "Veebilehe audit",
    },
    description: {
      en: "RankBoost scans your website and turns technical and content findings into prioritized growth tasks.",
      ru: "RankBoost проверяет сайт и превращает технические и контентные находки в приоритетные задачи роста.",
      et: "RankBoost skannib teie veebilehe ja muudab tehnilised ja sisuleiud prioriteetseteks kasvuülesanneteks.",
    },
    features: {
      en: ["Growth Score", "Technical checks", "Content signals", "Review-ready task list"],
      ru: ["Growth Score", "Технические проверки", "Контентные сигналы", "Список задач на одобрение"],
      et: ["Growth Score", "Tehnilised kontrollid", "Sisu signaalid", "Ülevaatamiseks valmis ülesanded"],
    },
  },
  {
    id: "growth-tasks",
    icon: "TrendingUp",
    title: {
      en: "Growth tasks",
      ru: "Задачи роста",
      et: "Kasvuülesanded",
    },
    description: {
      en: "See what to fix next — prioritized SEO and website improvements prepared for your review.",
      ru: "Понимайте, что исправить дальше — приоритетные SEO и улучшения сайта на ваше одобрение.",
      et: "Näete, mida järgmisena parandada — prioriteetsed SEO ja veebilehe parandused teie ülevaatuseks.",
    },
    features: {
      en: ["Priority labels", "Clear recommendations", "Track progress", "Nothing auto-applied"],
      ru: ["Приоритеты", "Понятные рекомендации", "Прогресс", "Ничего не применяется автоматически"],
      et: ["Prioriteedid", "Selged soovitused", "Edenemine", "Midagi ei rakendata automaatselt"],
    },
  },
  {
    id: "content-plan",
    icon: "FileText",
    title: {
      en: "Content planning",
      ru: "План контента",
      et: "Sisu planeerimine",
    },
    description: {
      en: "Article ideas and drafts prepared from your audit and growth plan — you approve before anything goes live.",
      ru: "Идеи и черновики статей из аудита и плана роста — вы одобряете до публикации.",
      et: "Artikliideed ja mustandid auditist ja kasvuplaanist — kinnitate enne avaldamist.",
    },
    features: {
      en: ["Article ideas", "Draft generation", "Review workflow", "WordPress draft option"],
      ru: ["Идеи статей", "Черновики", "Процесс одобрения", "Черновик в WordPress"],
      et: ["Artikliideed", "Mustandite genereerimine", "Kinnitamise voog", "WordPressi mustand"],
    },
  },
  {
    id: "social-drafts",
    icon: "Layout",
    title: {
      en: "Social post drafts",
      ru: "Черновики для соцсетей",
      et: "Sotsiaalmeedia mustandid",
    },
    description: {
      en: "Draft posts for your channels — copy, edit, and publish manually when you are ready.",
      ru: "Черновики постов для ваших каналов — копируйте, редактируйте и публикуйте вручную.",
      et: "Mustandpostitused teie kanalitele — kopeerige, muutke ja avaldage käsitsi.",
    },
    features: {
      en: ["Multi-platform drafts", "Copy-ready text", "No auto-publish", "Linked to content plan"],
      ru: ["Черновики для платформ", "Готовый текст", "Без автопубликации", "Связь с планом контента"],
      et: ["Mitme platvormi mustandid", "Kopeeritav tekst", "Automaatset avaldamist pole", "Seotud sisiplaaniga"],
    },
  },
  {
    id: "monthly-plan",
    icon: "Rocket",
    title: {
      en: "Monthly growth plan",
      ru: "Месячный план роста",
      et: "Igakuine kasvuplaan",
    },
    description: {
      en: "A draft monthly plan with SEO, content, and social priorities — approve what you want to act on.",
      ru: "Черновик месячного плана с SEO, контентом и соцсетями — одобряйте нужные действия.",
      et: "Igakuise plaani mustand SEO, sisu ja sotsiaalmeedia prioriteetidega — kinnitage, mida soovite teha.",
    },
    features: {
      en: ["Focus areas", "Risks and next steps", "Approve or regenerate", "Stays in your control"],
      ru: ["Фокусные области", "Риски и шаги", "Одобрить или пересоздать", "Под вашим контролем"],
      et: ["Fookusvaldkonnad", "Riskid ja järgmised sammud", "Kinnita või genereeri uuesti", "Teie kontrolli all"],
    },
  },
  {
    id: "gsc-insights",
    icon: "Globe",
    title: {
      en: "Google Search Console insights",
      ru: "Данные Google Search Console",
      et: "Google Search Console ülevaated",
    },
    description: {
      en: "Connect Search Console to unlock real queries, pages, and traffic opportunities in your workspace.",
      ru: "Подключите Search Console, чтобы видеть запросы, страницы и возможности роста в рабочем пространстве.",
      et: "Ühendage Search Console, et näha päringuid, lehti ja kasvuvõimalusi tööruumis.",
    },
    features: {
      en: ["Read-only connection", "Query opportunities", "Clicks and impressions", "You stay in control"],
      ru: ["Подключение только для чтения", "Возможности по запросам", "Клики и показы", "Вы контролируете доступ"],
      et: ["Ainult lugemisõigus", "Päringute võimalused", "Klikid ja kuvamised", "Teie kontrolli all"],
    },
  },
  {
    id: "wordpress-drafts",
    icon: "Settings",
    title: {
      en: "WordPress drafts",
      ru: "Черновики WordPress",
      et: "WordPressi mustandid",
    },
    description: {
      en: "Create WordPress drafts from approved content — start in Review Mode before any live publish.",
      ru: "Создавайте черновики WordPress из одобренного контента — начните в режиме проверки.",
      et: "Looge WordPressi mustandid kinnitatud sisust — alustage ülevaatusrežiimis.",
    },
    features: {
      en: ["Draft-first workflow", "Connector setup", "Review before live", "Secure connection"],
      ru: ["Сначала черновики", "Настройка коннектора", "Проверка перед публикацией", "Безопасное подключение"],
      et: ["Esmalt mustandid", "Konnektori seadistus", "Ülevaatus enne avaldamist", "Turvaline ühendus"],
    },
  },
  {
    id: "ai-search-readiness",
    icon: "Sparkles",
    title: {
      en: "AI search readiness",
      ru: "Готовность к AI-поиску",
      et: "AI-otsingu valmidus",
    },
    description: {
      en: "Improve clarity and structure so search engines and AI assistants can better understand your business and content.",
      ru: "Улучшайте ясность и структуру, чтобы поисковые и AI-системы лучше понимали ваш бизнес и контент.",
      et: "Parandage selgust ja struktuuri, et otsingu- ja AI-süsteemid mõistaksid teie ettevõtet ja sisu paremini.",
    },
    features: {
      en: ["Clear page structure", "FAQ-friendly content", "No ranking guarantees", "Google + AI focus"],
      ru: ["Понятная структура", "Контент для FAQ", "Без гарантий позиций", "Google + AI"],
      et: ["Selge lehe struktuur", "KKK-sõbralik sisu", "Positsioonigarantiid puuduvad", "Google + AI"],
    },
  },
  {
    id: "auto-publish-controls",
    icon: "Rocket",
    title: {
      en: "WordPress auto-publish controls",
      ru: "Автопубликация на WordPress",
      et: "WordPressi autopublish",
    },
    description: {
      en: "After you confirm a monthly plan with Auto-publish, RankBoost can publish approved articles to WordPress on schedule. Pause and roll back anytime. Custom sites get a package or webhook instead.",
      ru: "После подтверждения месячного плана с автопубликацией RankBoost может публиковать одобренные статьи на WordPress по расписанию. Пауза и откат в любой момент. Для custom-сайтов — пакет или webhook.",
      et: "Pärast kuuplaani Autopublish kinnitamist saab RankBoost avaldada kinnitatud artikleid WordPressis graafiku järgi. Paus ja tagasivõtmine igal ajal. Kohandatud saitidele pakett või webhook.",
    },
    features: {
      en: ["Confirm the plan monthly", "WordPress connected", "Pause anytime", "Rollback available"],
      ru: ["Подтверждение плана раз в месяц", "Подключённый WordPress", "Пауза в любой момент", "Откат доступен"],
      et: ["Kuuplaani kinnitus", "WordPress ühendatud", "Paus igal ajal", "Tagasivõtmine saadaval"],
    },
  },
];
