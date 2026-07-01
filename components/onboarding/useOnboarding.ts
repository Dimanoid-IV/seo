"use client";

import { useCallback, useEffect, useState } from "react";

import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { OnboardingViewModel } from "@/lib/onboarding/types";

type OnboardingState = {
  data: OnboardingViewModel | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<OnboardingViewModel | null>;
};

export function useOnboarding(): OnboardingState {
  const [data, setData] = useState<OnboardingViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/onboarding");

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, "Failed to load onboarding")
        );
        setData(null);
        return null;
      }

      const body = (await response.json()) as { data: { onboarding: OnboardingViewModel } };
      setData(body.data.onboarding);
      return body.data.onboarding;
    } catch {
      setError("Network error while loading onboarding");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOnboarding() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/onboarding");

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, "Failed to load onboarding")
            );
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
          setError("Network error while loading onboarding");
          setData(null);
          setLoading(false);
        }
      }
    }

    void loadOnboarding();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error, reload };
}
