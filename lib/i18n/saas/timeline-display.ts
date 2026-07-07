import type { SaasDictionary } from "./types";
import type { SaasLocale } from "./locales";
import { getSaasDictionary } from "./index";

export function translateTimelineSeverity(
  locale: SaasLocale,
  severity: string
): string {
  const labels = getSaasDictionary(locale).timeline.severityLabels;
  return labels[severity] ?? severity;
}

export function translateTimelineSeverityFromDict(
  dict: SaasDictionary,
  severity: string
): string {
  return dict.timeline.severityLabels[severity] ?? severity;
}
