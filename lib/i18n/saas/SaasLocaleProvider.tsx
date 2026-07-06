"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getSaasDictionary,
  type SaasDictionary,
  type SaasLocale,
} from "@/lib/i18n/saas";
import { setClientLocale } from "@/lib/i18n/saas/locale-state";
import { persistLocale, resolveInitialLocale } from "@/lib/i18n/saas/storage";

type SaasLocaleContextValue = {
  locale: SaasLocale;
  dict: SaasDictionary;
  setLocale: (locale: SaasLocale) => void;
};

const SaasLocaleContext = createContext<SaasLocaleContextValue | null>(null);

function useInitialLocale(): SaasLocale {
  const [locale] = useState<SaasLocale>(() => {
    const initial = resolveInitialLocale();
    setClientLocale(initial);
    return initial;
  });
  return locale;
}

export function SaasLocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLocale = useInitialLocale();
  const [locale, setLocaleState] = useState<SaasLocale>(initialLocale);

  const setLocale = useCallback((next: SaasLocale) => {
    setLocaleState(next);
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
