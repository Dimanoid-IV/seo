import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";

type ContactLinkParams = {
  plan?: string;
  service?: string;
  source?: string;
};

export function getContactPath(params?: ContactLinkParams): string {
  const search = new URLSearchParams();
  if (params?.plan) search.set("plan", params.plan);
  if (params?.service) search.set("service", params.service);
  if (params?.source) search.set("source", params.source);
  const query = search.toString();
  return `/contact${query ? `?${query}` : ""}#contact-form`;
}

export function getContactHref(locale: Locale, params?: ContactLinkParams): string {
  return getLocalizedPath(locale, getContactPath(params));
}

/** Rewrites legacy /{locale}/contact links to the form anchor with prefill params. */
export function normalizeContactHref(
  href: string,
  params?: ContactLinkParams
): string {
  const match = href.match(/^\/(ru|et|en)\/contact\/?$/);
  if (!match) return href;
  return getContactHref(match[1] as Locale, params);
}
