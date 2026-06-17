import { defaultLocale, locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { getArticleSlugsByTranslationKey } from "@/data/blog-posts";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ru: () => import("@/i18n/dictionaries/ru").then((m) => m.dictionary),
  et: () => import("@/i18n/dictionaries/et").then((m) => m.dictionary),
  en: () => import("@/i18n/dictionaries/en").then((m) => m.dictionary),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocalizedPath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function getArticleTranslations(translationKey: string) {
  return getArticleSlugsByTranslationKey(translationKey);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const segment = pathname.split("/")[1];
  return segment && isValidLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  const stripped = pathname.replace(`/${locale}`, "") || "/";
  return stripped;
}

export function switchLocalePath(
  currentPathname: string,
  targetLocale: Locale
): string {
  const pathWithoutLocale = stripLocaleFromPathname(currentPathname);
  return getLocalizedPath(targetLocale, pathWithoutLocale);
}

export { defaultLocale, locales };
export type { Locale, Dictionary };
