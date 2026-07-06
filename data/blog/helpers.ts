import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";
import type { ContentSection } from "./types";

export function blogPath(locale: Locale, path: string): string {
  return getLocalizedPath(locale, path);
}

export function serviceLinks(locale: Locale): ContentSection {
  const labels: Record<
    Locale,
    { title: string; product: string; pricing: string; preview: string }
  > = {
    ru: {
      title: "Полезные материалы",
      product: "Возможности платформы",
      pricing: "Тарифы",
      preview: "Превью роста",
    },
    et: {
      title: "Kasulikud lingid",
      product: "Platvormi võimalused",
      pricing: "Paketid",
      preview: "Kasvu eelvaade",
    },
    en: {
      title: "Helpful links",
      product: "Platform capabilities",
      pricing: "Pricing",
      preview: "Growth preview",
    },
  };
  const l = labels[locale];
  return {
    type: "links",
    title: l.title,
    items: [
      { label: l.product, href: blogPath(locale, "/services") },
      { label: l.pricing, href: blogPath(locale, "/pricing") },
      { label: l.preview, href: "/audit" },
    ],
  };
}

export function articleCta(locale: Locale): ContentSection {
  const ctas: Record<Locale, { title: string; description: string; button: string }> = {
    ru: {
      title: "Готовы проверить возможности роста?",
      description:
        "Запустите бесплатное превью сайта или создайте аккаунт, чтобы превратить находки в план роста и черновики на ваше одобрение.",
      button: "Начать бесплатно",
    },
    et: {
      title: "Kas olete valmis kasvuvõimalusi kontrollima?",
      description:
        "Käivitage tasuta veebilehe eelvaade või looge konto, et muuta leitud võimalused kasvuplaaniks ja mustanditeks teie kinnituseks.",
      button: "Alusta tasuta",
    },
    en: {
      title: "Ready to explore growth opportunities?",
      description:
        "Run a free website preview or create an account to turn findings into a growth plan and review-ready drafts.",
      button: "Start free",
    },
  };
  const c = ctas[locale];
  return {
    type: "cta",
    title: c.title,
    description: c.description,
    buttonLabel: c.button,
    href: "/register",
  };
}

export function faqBlockTitle(locale: Locale): string {
  return locale === "ru" ? "Частые вопросы" : locale === "et" ? "Korduma kippuvad küsimused" : "FAQ";
}
