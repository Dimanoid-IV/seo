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

type RefetchOptions = {
  silent?: boolean;
};

type DashboardOverviewContextValue = {
  overview: DashboardOverviewData | null;
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
  data: DashboardOverviewData | null;
  error: string | null;
}> {
  try {
    const response = await authFetch("/api/dashboard/overview");

    if (!response.ok) {
      return { data: null, error: "Не удалось загрузить данные кабинета" };
    }

    const body = (await response.json()) as { data: DashboardOverviewData };
    return { data: body.data, error: null };
  } catch {
    return { data: null, error: "Сетевая ошибка при загрузке кабинета" };
  }
}

export function DashboardOverviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (options?: RefetchOptions) => {
    if (!options?.silent) {
      setLoading(true);
      setError(null);
    }

    const result = await fetchOverview();
    setOverview(result.data);
    if (!options?.silent) {
      setError(result.error);
      setLoading(false);
    } else if (result.error) {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialOverview() {
      const result = await fetchOverview();
      if (cancelled) {
        return;
      }
      setOverview(result.data);
      setError(result.error);
      setLoading(false);
    }

    void loadInitialOverview();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      overview,
      loading,
      error,
      refetch,
    }),
    [overview, loading, error, refetch]
  );

  return (
    <DashboardOverviewContext.Provider value={value}>
      {children}
    </DashboardOverviewContext.Provider>
  );
}
