import { IntegrationProvider, IntegrationStatus } from "@prisma/client";
import { IntegrationCapability } from "@/lib/integrations/adapters/capabilities";

export type IntegrationCatalogEntry = {
  provider: string;
  dbProvider: IntegrationProvider | null;
  title: string;
  description: string;
  available: boolean;
  comingSoon: boolean;
  category:
    | "seo_data"
    | "publishing"
    | "cms"
    | "commerce"
    | "automation"
    | "platform";
  capabilities: IntegrationCapability[];
  platformManaged?: boolean;
};

export const INTEGRATION_CATALOG: IntegrationCatalogEntry[] = [
  {
    provider: "google_search_console",
    dbProvider: IntegrationProvider.GOOGLE_SEARCH_CONSOLE,
    title: "Google Search Console",
    description:
      "Данные о кликах, показах и позициях в Google — для приоритетов роста.",
    available: true,
    comingSoon: false,
    category: "seo_data",
    capabilities: [
      IntegrationCapability.ANALYTICS_READ_METRICS,
      IntegrationCapability.SITEMAP_DISCOVER_URLS,
    ],
  },
  {
    provider: "google_analytics",
    dbProvider: IntegrationProvider.GOOGLE_ANALYTICS,
    title: "Google Analytics",
    description:
      "Трафик, конверсии и поведение пользователей для точных решений.",
    available: false,
    comingSoon: true,
    category: "seo_data",
    capabilities: [IntegrationCapability.ANALYTICS_READ_METRICS],
  },
  {
    provider: "google_business_profile",
    dbProvider: IntegrationProvider.GOOGLE_BUSINESS_PROFILE,
    title: "Google Business Profile",
    description:
      "Локальная видимость, отзывы и карточка компании в Google Maps.",
    available: false,
    comingSoon: true,
    category: "seo_data",
    capabilities: [
      IntegrationCapability.LOCAL_PROFILE_READ,
      IntegrationCapability.LOCAL_PROFILE_POST_PREPARE,
    ],
  },
  {
    provider: "wordpress",
    dbProvider: IntegrationProvider.WORDPRESS,
    title: "WordPress",
    description:
      "Публикация статей и обновлений SEO прямо на ваш сайт без ручного копирования.",
    available: true,
    comingSoon: false,
    category: "cms",
    capabilities: [
      IntegrationCapability.CREATE_WORDPRESS_DRAFT,
      IntegrationCapability.PUBLISH_WORDPRESS_ARTICLE,
      IntegrationCapability.UPDATE_WORDPRESS_ARTICLE,
      IntegrationCapability.APPLY_SEO_META,
      IntegrationCapability.ROLLBACK_WORDPRESS_ARTICLE,
    ],
  },
  {
    provider: "custom_webhook",
    dbProvider: IntegrationProvider.CUSTOM_WEBHOOK,
    title: "Custom API / Webhook",
    description:
      "Один защищённый endpoint для самописных сайтов и любых CMS без готового коннектора.",
    available: true,
    comingSoon: false,
    category: "publishing",
    capabilities: [
      IntegrationCapability.SEND_CUSTOM_WEBHOOK,
      IntegrationCapability.PREPARE_UNIVERSAL_PACKAGE,
      IntegrationCapability.TEST_CONNECTION,
    ],
  },
  {
    provider: "hosted_blog",
    dbProvider: IntegrationProvider.HOSTED_BLOG,
    title: "Hosted Blog",
    description:
      "Публичные SEO-страницы RankBoost как запасной путь, пока CMS клиента не подключена.",
    available: true,
    comingSoon: false,
    category: "publishing",
    platformManaged: true,
    capabilities: [
      IntegrationCapability.HOSTED_BLOG_ARTICLE_CREATE,
      IntegrationCapability.HOSTED_BLOG_ARTICLE_PUBLISH,
    ],
  },
  {
    provider: "webflow",
    dbProvider: IntegrationProvider.WEBFLOW,
    title: "Webflow",
    description:
      "Публикация в Webflow CMS collections и обновление SEO-полей страниц.",
    available: true,
    comingSoon: false,
    category: "cms",
    capabilities: [
      IntegrationCapability.CMS_ARTICLE_CREATE,
      IntegrationCapability.CMS_ARTICLE_PUBLISH,
      IntegrationCapability.CMS_META_UPDATE,
    ],
  },
  {
    provider: "shopify",
    dbProvider: IntegrationProvider.SHOPIFY,
    title: "Shopify",
    description:
      "SEO для e-commerce: блог, коллекции, карточки товаров и внутренние ссылки.",
    available: true,
    comingSoon: false,
    category: "commerce",
    capabilities: [
      IntegrationCapability.ECOMMERCE_BLOG_PUBLISH,
      IntegrationCapability.ECOMMERCE_PRODUCT_SEO_UPDATE,
    ],
  },
  {
    provider: "wix",
    dbProvider: IntegrationProvider.WIX,
    title: "Wix",
    description:
      "Путь для малого бизнеса на Wix: статьи, SEO-поля и понятная ручная страховка.",
    available: false,
    comingSoon: true,
    category: "cms",
    capabilities: [
      IntegrationCapability.CMS_ARTICLE_CREATE,
      IntegrationCapability.CMS_META_UPDATE,
    ],
  },
  {
    provider: "squarespace",
    dbProvider: IntegrationProvider.SQUARESPACE,
    title: "Squarespace",
    description:
      "Подготовка и будущая отправка SEO-контента для сайтов Squarespace.",
    available: false,
    comingSoon: true,
    category: "cms",
    capabilities: [
      IntegrationCapability.CMS_ARTICLE_CREATE,
      IntegrationCapability.CMS_META_UPDATE,
    ],
  },
  {
    provider: "ghost",
    dbProvider: IntegrationProvider.GHOST,
    title: "Ghost",
    description:
      "Публикация SEO-статей в Ghost с тегами, excerpt и canonical metadata.",
    available: true,
    comingSoon: false,
    category: "cms",
    capabilities: [
      IntegrationCapability.CMS_ARTICLE_CREATE,
      IntegrationCapability.CMS_ARTICLE_PUBLISH,
      IntegrationCapability.CMS_META_UPDATE,
    ],
  },
  {
    provider: "github",
    dbProvider: IntegrationProvider.GITHUB,
    title: "GitHub PR",
    description:
      "Безопасный путь для кастомных сайтов: RankBoost создаёт pull request с статьёй или SEO-fix.",
    available: true,
    comingSoon: false,
    category: "publishing",
    capabilities: [IntegrationCapability.GITHUB_CREATE_PULL_REQUEST],
  },
  {
    provider: "sitemap",
    dbProvider: IntegrationProvider.SITEMAP,
    title: "Sitemap / URL discovery",
    description:
      "Автоматическое чтение sitemap.xml, robots.txt и URL сайта без паролей.",
    available: true,
    comingSoon: false,
    category: "seo_data",
    platformManaged: true,
    capabilities: [IntegrationCapability.SITEMAP_DISCOVER_URLS],
  },
  {
    provider: "zapier",
    dbProvider: IntegrationProvider.ZAPIER,
    title: "Zapier",
    description:
      "No-code автоматизация для команд, которым удобнее собирать публикацию через Zap.",
    available: false,
    comingSoon: true,
    category: "automation",
    capabilities: [IntegrationCapability.NO_CODE_AUTOMATION_TRIGGER],
  },
  {
    provider: "make",
    dbProvider: IntegrationProvider.MAKE,
    title: "Make",
    description:
      "No-code сценарии публикации и уведомлений для кастомных процессов.",
    available: false,
    comingSoon: true,
    category: "automation",
    capabilities: [IntegrationCapability.NO_CODE_AUTOMATION_TRIGGER],
  },
  {
    provider: "cloudflare",
    dbProvider: null,
    title: "Cloudflare",
    description:
      "Скорость, CDN и безопасность — для технического роста и стабильности.",
    available: false,
    comingSoon: true,
    category: "platform",
    capabilities: [],
  },
  {
    provider: "resend",
    dbProvider: null,
    title: "Resend",
    description:
      "Email-отчёты и уведомления о прогрессе сайта для вашей команды.",
    available: true,
    comingSoon: false,
    category: "platform",
    platformManaged: true,
    capabilities: [],
  },
  {
    provider: "hermes_ai",
    dbProvider: null,
    title: "Hermes AI",
    description:
      "Platform AI engine for review-first SEO recommendations and content drafts.",
    available: true,
    comingSoon: false,
    category: "platform",
    platformManaged: true,
    capabilities: [],
  },
];

export function mapIntegrationDbStatus(
  status: IntegrationStatus | undefined
): { connected: boolean; status: string } {
  if (!status || status === IntegrationStatus.DISCONNECTED) {
    return { connected: false, status: "Disconnected" };
  }
  if (status === IntegrationStatus.CONNECTED) {
    return { connected: true, status: "Connected" };
  }
  if (status === IntegrationStatus.CONNECTING) {
    return { connected: false, status: "Connecting" };
  }
  if (status === IntegrationStatus.ERROR) {
    return { connected: false, status: "Error" };
  }
  if (status === IntegrationStatus.REVOKED) {
    return { connected: false, status: "Revoked" };
  }
  return { connected: false, status: "Disconnected" };
}
