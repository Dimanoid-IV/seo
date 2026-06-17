import type { Metadata } from "next";
import { siteUrl, type Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";

type PageMeta = {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
};

export function buildCanonical(locale: Locale, path: string): string {
  return `${siteUrl}${getLocalizedPath(locale, path)}`;
}

export function buildAlternateLanguages(path: string): Record<string, string> {
  return {
    ru: `${siteUrl}${getLocalizedPath("ru", path)}`,
    et: `${siteUrl}${getLocalizedPath("et", path)}`,
    en: `${siteUrl}${getLocalizedPath("en", path)}`,
    "x-default": `${siteUrl}${getLocalizedPath("ru", path)}`,
  };
}

export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  image,
  noIndex,
  keywords,
}: PageMeta): Metadata {
  const canonical = buildCanonical(locale, path);
  const ogImage = image ?? `${siteUrl}/opengraph-image`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages: buildAlternateLanguages(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "RankBoost.eu",
      locale: locale === "ru" ? "ru_RU" : locale === "et" ? "et_EE" : "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const SEO_KEYWORDS: Record<Locale, string[]> = {
  ru: [
    "SEO продвижение Эстония",
    "SEO продвижение Таллин",
    "SEO оптимизация сайта",
    "SEO аудит сайта",
    "Local SEO Estonia",
    "SEO для малого бизнеса",
    "SEO для интернет-магазина",
    "продвижение сайта в Google",
    "SEO услуги Европа",
    "SEO агентство Эстония",
    "техническое SEO",
  ],
  et: [
    "SEO teenus Eestis",
    "SEO optimeerimine",
    "kodulehe optimeerimine",
    "SEO audit",
    "kohalik SEO Tallinnas",
    "Google otsingumootori optimeerimine",
    "SEO väikeettevõttele",
    "e-poe SEO",
    "SEO agentuur Eestis",
    "tehniline SEO",
  ],
  en: [
    "SEO services Estonia",
    "SEO agency Estonia",
    "SEO optimization Europe",
    "local SEO Tallinn",
    "technical SEO audit",
    "SEO for small business",
    "ecommerce SEO",
    "Google SEO services",
    "multilingual SEO Europe",
    "SEO content services",
  ],
};
