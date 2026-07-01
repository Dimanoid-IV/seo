import { IntegrationProvider, IntegrationStatus } from "@prisma/client";

export type IntegrationCatalogEntry = {
  provider: string;
  dbProvider: IntegrationProvider | null;
  title: string;
  description: string;
  available: boolean;
  comingSoon: boolean;
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
  },
  {
    provider: "google_analytics",
    dbProvider: IntegrationProvider.GOOGLE_ANALYTICS,
    title: "Google Analytics",
    description:
      "Трафик, конверсии и поведение пользователей для точных решений.",
    available: false,
    comingSoon: true,
  },
  {
    provider: "google_business_profile",
    dbProvider: IntegrationProvider.GOOGLE_BUSINESS_PROFILE,
    title: "Google Business Profile",
    description:
      "Локальная видимость, отзывы и карточка компании в Google Maps.",
    available: false,
    comingSoon: true,
  },
  {
    provider: "wordpress",
    dbProvider: IntegrationProvider.WORDPRESS,
    title: "WordPress",
    description:
      "Публикация статей и обновлений SEO прямо на ваш сайт без ручного копирования.",
    available: true,
    comingSoon: false,
  },
  {
    provider: "cloudflare",
    dbProvider: null,
    title: "Cloudflare",
    description:
      "Скорость, CDN и безопасность — для технического роста и стабильности.",
    available: false,
    comingSoon: true,
  },
  {
    provider: "resend",
    dbProvider: null,
    title: "Resend",
    description:
      "Email-отчёты и уведомления о прогрессе сайта для вашей команды.",
    available: true,
    comingSoon: false,
  },
  {
    provider: "hermes_ai",
    dbProvider: null,
    title: "Hermes AI",
    description:
      "Глубокий аудит и генерация контента на базе AI — в следующих релизах.",
    available: false,
    comingSoon: true,
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
