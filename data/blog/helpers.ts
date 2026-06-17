import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";
import { getContactHref } from "@/lib/contact-links";
import type { ContentSection } from "./types";

export function blogPath(locale: Locale, path: string): string {
  return getLocalizedPath(locale, path);
}

export function serviceLinks(locale: Locale): ContentSection {
  const labels: Record<Locale, { title: string; services: string; pricing: string; contact: string }> = {
    ru: { title: "Полезные материалы", services: "SEO-услуги", pricing: "Тарифы", contact: "Контакты" },
    et: { title: "Kasulikud lingid", services: "SEO teenused", pricing: "Hinnakiri", contact: "Kontakt" },
    en: { title: "Helpful links", services: "SEO Services", pricing: "Pricing", contact: "Contact" },
  };
  const l = labels[locale];
  return {
    type: "links",
    title: l.title,
    items: [
      { label: l.services, href: blogPath(locale, "/services") },
      { label: l.pricing, href: blogPath(locale, "/pricing") },
      { label: l.contact, href: getContactHref(locale, { source: "blog" }) },
    ],
  };
}

export function articleCta(locale: Locale): ContentSection {
  const ctas: Record<Locale, { title: string; description: string; button: string }> = {
    ru: {
      title: "Нужна помощь с SEO?",
      description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
      button: "Получить SEO-аудит",
    },
    et: {
      title: "Vajate abi SEO-ga?",
      description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
      button: "Küsi SEO-auditit",
    },
    en: {
      title: "Need SEO help?",
      description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
      button: "Get an SEO Audit",
    },
  };
  const c = ctas[locale];
  return {
    type: "cta",
    title: c.title,
    description: c.description,
    buttonLabel: c.button,
    href: getContactHref(locale, { service: "seo-audit", source: "blog-cta" }),
  };
}

export function faqBlockTitle(locale: Locale): string {
  return locale === "ru" ? "Частые вопросы" : locale === "et" ? "Korduma kippuvad küsimused" : "FAQ";
}
