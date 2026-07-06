import type { SaasLocale } from "./locales";
import { DEFAULT_SAAS_LOCALE } from "./locales";

let clientLocale: SaasLocale = DEFAULT_SAAS_LOCALE;

export function getClientLocale(): SaasLocale {
  return clientLocale;
}

export function setClientLocale(locale: SaasLocale): void {
  clientLocale = locale;
}
