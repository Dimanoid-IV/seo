export const SAAS_LOCALES = ["en", "ru", "et"] as const;
export type SaasLocale = (typeof SAAS_LOCALES)[number];

export const DEFAULT_SAAS_LOCALE: SaasLocale = "en";

export const SAAS_LOCALE_COOKIE = "rankboost_locale";
export const SAAS_LOCALE_STORAGE_KEY = "rankboost_locale";

export const saasLocaleLabels: Record<SaasLocale, string> = {
  en: "English",
  ru: "Русский",
  et: "Eesti",
};

export function isSaasLocale(value: string): value is SaasLocale {
  return (SAAS_LOCALES as readonly string[]).includes(value);
}

export function resolveBrowserLocale(): SaasLocale {
  if (typeof navigator === "undefined") {
    return DEFAULT_SAAS_LOCALE;
  }

  const language = navigator.language.toLowerCase();
  if (language.startsWith("ru")) return "ru";
  if (language.startsWith("et")) return "et";
  return DEFAULT_SAAS_LOCALE;
}
