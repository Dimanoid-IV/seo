"use client";

import { useEffect } from "react";
import type { Locale } from "@/i18n/config";

const langMap: Record<Locale, string> = {
  ru: "ru",
  et: "et",
  en: "en",
};

export function LangSetter({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = langMap[locale];
  }, [locale]);

  return null;
}
