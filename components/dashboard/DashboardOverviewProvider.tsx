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
import type { DashboardOverviewData } from "@/lib/dashboard/overview";
import type { SimpleDashboardViewModel } from "@/lib/dashboard/simple-overview";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type RefetchOptions = {
  silent?: boolean;
};

type DashboardOverviewContextValue = {
  overview: DashboardOverviewData | null;
  simple: SimpleDashboardViewModel | null;
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

async function fetchOverview(): Promise<{
  overview: DashboardOverviewData | null;
  simple: SimpleDashboardViewModel | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/dashboard/overview");

    if (!response.ok) {
      return {
        overview: null,
        simple: null,
        error: "loadFailed",
      };
    }

    const body = (await response.json()) as {
      data: DashboardOverviewData;
      simple?: SimpleDashboardViewModel;
    };
    return {
      overview: body.data,
      simple: body.simple ?? null,
      error: null,
    };
  } catch {
    return {
      overview: null,
      simple: null,
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
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [simple, setSimple] = useState<SimpleDashboardViewModel | null>(null);
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

    const result = await fetchOverview();
    setOverview(result.overview);
    setSimple(result.simple);
    if (!options?.silent) {
      setErrorKey(result.error);
      setLoading(false);
    } else if (result.error) {
      setErrorKey(result.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialOverview() {
      const result = await fetchOverview();
      if (cancelled) {
        return;
      }
      setOverview(result.overview);
      setSimple(result.simple);
      setErrorKey(result.error);
      setLoading(false);
    }

    void loadInitialOverview();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const value = useMemo(
    () => ({
      overview,
      simple,
      loading,
      error,
      refetch,
    }),
    [overview, simple, loading, error, refetch]
  );

  return (
    <DashboardOverviewContext.Provider value={value}>
      {children}
    </DashboardOverviewContext.Provider>
  );
}
