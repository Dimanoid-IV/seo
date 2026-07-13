"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  getSaasDictionary,
  type SaasDictionary,
  type SaasLocale,
} from "@/lib/i18n/saas";
import { DEFAULT_SAAS_LOCALE } from "@/lib/i18n/saas/locales";
import { setClientLocale } from "@/lib/i18n/saas/locale-state";
import {
  persistLocale,
  readClientLocaleSnapshot,
  subscribeLocale,
} from "@/lib/i18n/saas/storage";

type SaasLocaleContextValue = {
  locale: SaasLocale;
  dict: SaasDictionary;
  setLocale: (locale: SaasLocale) => void;
};

const SaasLocaleContext = createContext<SaasLocaleContextValue | null>(null);

export function SaasLocaleProvider({
  children,
  initialLocale = DEFAULT_SAAS_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: SaasLocale;
}) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    readClientLocaleSnapshot,
    () => initialLocale
  );

  useEffect(() => {
    setClientLocale(locale);
  }, [locale]);

  const setLocale = useCallback((next: SaasLocale) => {
    setClientLocale(next);
    persistLocale(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      dict: getSaasDictionary(locale),
      setLocale,
    }),
    [locale, setLocale]
  );

  return (
    <SaasLocaleContext.Provider value={value}>
      {children}
    </SaasLocaleContext.Provider>
  );
}

export function useSaasTranslations(): SaasLocaleContextValue {
  const context = useContext(SaasLocaleContext);
  if (!context) {
    throw new Error("useSaasTranslations must be used within SaasLocaleProvider");
  }
  return context;
}

export function useSaasTranslationsOptional(): SaasLocaleContextValue | null {
  return useContext(SaasLocaleContext);
}
