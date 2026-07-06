import type { SaasLocale } from "../locales";
import { DEFAULT_SAAS_LOCALE } from "../locales";
import { serverStringsEn } from "./en";
import { serverStringsRu } from "./ru";
import { serverStringsEt } from "./et";
import type { SaasServerStrings } from "./types";

const strings: Record<SaasLocale, SaasServerStrings> = {
  en: serverStringsEn,
  ru: serverStringsRu,
  et: serverStringsEt,
};

export function getServerStrings(locale: SaasLocale): SaasServerStrings {
  return strings[locale] ?? strings[DEFAULT_SAAS_LOCALE];
}

export type { SaasServerStrings };
