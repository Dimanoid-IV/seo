import type { SaasLocale } from "./locales";
import {
  DEFAULT_SAAS_LOCALE,
  SAAS_LOCALE_COOKIE,
  SAAS_LOCALE_STORAGE_KEY,
  isSaasLocale,
  resolveBrowserLocale,
} from "./locales";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readStoredLocale(): SaasLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(SAAS_LOCALE_STORAGE_KEY);
  if (fromStorage && isSaasLocale(fromStorage)) {
    return fromStorage;
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SAAS_LOCALE_COOKIE}=`));
  const fromCookie = cookieMatch?.split("=")[1];
  if (fromCookie && isSaasLocale(fromCookie)) {
    return fromCookie;
  }

  return null;
}

export function persistLocale(locale: SaasLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAAS_LOCALE_STORAGE_KEY, locale);
  document.cookie = `${SAAS_LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function resolveInitialLocale(): SaasLocale {
  return readStoredLocale() ?? resolveBrowserLocale() ?? DEFAULT_SAAS_LOCALE;
}

export function readLocaleFromCookieHeader(
  cookieHeader: string | null | undefined
): SaasLocale {
  if (!cookieHeader) {
    return DEFAULT_SAAS_LOCALE;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SAAS_LOCALE_COOKIE}=`));

  const value = match?.split("=")[1];
  if (value && isSaasLocale(value)) {
    return value;
  }

  return DEFAULT_SAAS_LOCALE;
}
