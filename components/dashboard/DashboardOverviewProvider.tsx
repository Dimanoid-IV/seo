"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authFetch } from "@/lib/auth/client-session";
import type { HomeScreenData } from "@/lib/dashboard/home";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type RefetchOptions = {
  silent?: boolean;
};

type DashboardOverviewContextValue = {
  home: HomeScreenData | null;
  /** @deprecated Use `home` — kept for billing refetch compatibility */
  overview: { website: HomeScreenData["website"] } | null;
  /** @deprecated Removed from home screen */
  simple: null;
  loading: boolean;
  error: string | null;
  refetch: (options?: RefetchOptions) => Promise<void>;
};

const DashboardOverviewContext =
  createContext<DashboardOverviewContextValue | null>(null);

export function useDashboardOverview(): DashboardOverviewContextValue {
  const context = useContext(DashboardOverviewContext);
  if (!context) {
    throw new Error(
      "useDashboardOverview must be used within DashboardOverviewProvider"
    );
  }
  return context;
}

async function fetchHome(): Promise<{
  home: HomeScreenData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/dashboard/home");

    if (!response.ok) {
      return {
        home: null,
        error: "loadFailed",
      };
    }

    const body = (await response.json()) as { data: HomeScreenData };
    return {
      home: body.data,
      error: null,
    };
  } catch {
    return {
      home: null,
      error: "loadNetworkError",
    };
  }
}

export function DashboardOverviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dict, locale } = useSaasTranslations();
  const [home, setHome] = useState<HomeScreenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const error = errorKey
    ? errorKey === "loadNetworkError"
      ? dict.dashboard.loadNetworkError
      : dict.dashboard.loadFailed
    : null;

  const refetch = useCallback(async (options?: RefetchOptions) => {
    if (!options?.silent) {
      setLoading(true);
      setErrorKey(null);
    }

    const result = await fetchHome();
    setHome(result.home);
    if (!options?.silent) {
      setErrorKey(result.error);
      setLoading(false);
    } else if (result.error) {
      setErrorKey(result.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialHome() {
      const result = await fetchHome();
      if (cancelled) {
        return;
      }
      setHome(result.home);
      setErrorKey(result.error);
      setLoading(false);
    }

    void loadInitialHome();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const overview = useMemo(
    () => (home?.website ? { website: home.website } : null),
    [home]
  );

  const value = useMemo(
    () => ({
      home,
      overview,
      simple: null,
      loading,
      error,
      refetch,
    }),
    [home, overview, loading, error, refetch]
  );

  return (
    <DashboardOverviewContext.Provider value={value}>
      {children}
    </DashboardOverviewContext.Provider>
  );
}
