import type { SaasLocale } from "./locales";
import {
  DEFAULT_SAAS_LOCALE,
  SAAS_LOCALE_COOKIE,
  SAAS_LOCALE_STORAGE_KEY,
  isSaasLocale,
  resolveBrowserLocale,
} from "./locales";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const localeListeners = new Set<() => void>();

export function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

function notifyLocaleChange(): void {
  localeListeners.forEach((listener) => listener());
}

function readLocaleFromDocumentCookie(): SaasLocale | null {
  if (typeof document === "undefined") {
    return null;
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

export function readStoredLocale(): SaasLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(SAAS_LOCALE_STORAGE_KEY);
  if (fromStorage && isSaasLocale(fromStorage)) {
    return fromStorage;
  }

  return readLocaleFromDocumentCookie();
}

/** Keeps the locale cookie aligned with localStorage for SSR on soft navigations. */
export function syncLocaleCookieFromStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  const fromStorage = window.localStorage.getItem(SAAS_LOCALE_STORAGE_KEY);
  if (!fromStorage || !isSaasLocale(fromStorage)) {
    return;
  }

  const fromCookie = readLocaleFromDocumentCookie();
  if (fromCookie === fromStorage) {
    return;
  }

  document.cookie = `${SAAS_LOCALE_COOKIE}=${fromStorage}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function persistLocale(locale: SaasLocale): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SAAS_LOCALE_STORAGE_KEY, locale);
  document.cookie = `${SAAS_LOCALE_COOKIE}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  notifyLocaleChange();
}

export function readClientLocaleSnapshot(): SaasLocale {
  syncLocaleCookieFromStorage();
  return readStoredLocale() ?? resolveBrowserLocale() ?? DEFAULT_SAAS_LOCALE;
}

export function resolveInitialLocale(): SaasLocale {
  return readClientLocaleSnapshot();
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

export function readLocaleFromCookieStore(
  getCookie: (name: string) => { value: string } | undefined
): SaasLocale {
  const value = getCookie(SAAS_LOCALE_COOKIE)?.value;
  if (value && isSaasLocale(value)) {
    return value;
  }

  return DEFAULT_SAAS_LOCALE;
}

if (typeof window !== "undefined") {
  syncLocaleCookieFromStorage();
}
