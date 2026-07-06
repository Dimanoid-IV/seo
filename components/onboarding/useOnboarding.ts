"use client";

import { useCallback, useEffect, useState } from "react";

import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { OnboardingViewModel } from "@/lib/onboarding/types";

type OnboardingState = {
  data: OnboardingViewModel | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<OnboardingViewModel | null>;
};

export function useOnboarding(): OnboardingState {
  const { dict, locale } = useSaasTranslations();
  const o = dict.onboarding;
  const [data, setData] = useState<OnboardingViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/onboarding");

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, o.loadFailed));
        setData(null);
        return null;
      }

      const body = (await response.json()) as { data: { onboarding: OnboardingViewModel } };
      setData(body.data.onboarding);
      return body.data.onboarding;
    } catch {
      setError(o.loadNetworkError);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [o.loadFailed, o.loadNetworkError]);

  useEffect(() => {
    let cancelled = false;

    async function loadOnboarding() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/onboarding");

        if (!response.ok) {
          if (!cancelled) {
            setError(await parseApiErrorMessage(response, o.loadFailed));
            setData(null);
            setLoading(false);
          }
          return;
        }

        const body = (await response.json()) as {
          data: { onboarding: OnboardingViewModel };
        };

        if (!cancelled) {
          setData(body.data.onboarding);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(o.loadNetworkError);
          setData(null);
          setLoading(false);
        }
      }
    }

    void loadOnboarding();

    return () => {
      cancelled = true;
    };
  }, [locale, o.loadFailed, o.loadNetworkError]);

  return { data, loading, error, reload };
}
