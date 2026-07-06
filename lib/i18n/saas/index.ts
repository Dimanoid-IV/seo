import type { SaasLocale } from "./locales";
import { DEFAULT_SAAS_LOCALE } from "./locales";
import type { SaasDictionary } from "./types";
import { saasDictionary as en } from "./dictionaries/en";
import { saasDictionary as ru } from "./dictionaries/ru";
import { saasDictionary as et } from "./dictionaries/et";

const dictionaries: Record<SaasLocale, SaasDictionary> = {
  en,
  ru,
  et,
};

export function getSaasDictionary(locale: SaasLocale): SaasDictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_SAAS_LOCALE];
}

export type { SaasDictionary, SaasLocale };
