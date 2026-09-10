import type { SaasLocale } from "./locales";
import { DEFAULT_SAAS_LOCALE, isSaasLocale } from "./locales";
import { readLocaleFromCookieHeader } from "./storage";

export function getLocaleFromRequest(request: Request): SaasLocale {
  const requestedLocale = request.headers.get("x-rankboost-locale");
  if (requestedLocale && isSaasLocale(requestedLocale)) {
    return requestedLocale;
  }
  return readLocaleFromCookieHeader(request.headers.get("cookie"));
}

export function getLocaleFromHeaders(
  cookieHeader: string | null | undefined
): SaasLocale {
  return readLocaleFromCookieHeader(cookieHeader) ?? DEFAULT_SAAS_LOCALE;
}
