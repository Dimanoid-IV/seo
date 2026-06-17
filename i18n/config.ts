export const locales = ["ru", "et", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ru";

export const localeNames: Record<Locale, string> = {
  ru: "RU",
  et: "ET",
  en: "EN",
};

export const localeLabels: Record<Locale, string> = {
  ru: "Русский",
  et: "Eesti",
  en: "English",
};

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rankboost.eu";
