"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  type DashboardMode,
  DEFAULT_DASHBOARD_MODE,
  readDashboardMode,
  subscribeDashboardMode,
  writeDashboardMode,
} from "@/lib/dashboard/mode";

type DashboardModeContextValue = {
  mode: DashboardMode;
  isSimple: boolean;
  isAdvanced: boolean;
  ready: boolean;
  setMode: (mode: DashboardMode) => void;
  toggleMode: () => void;
};

const DashboardModeContext = createContext<DashboardModeContextValue | null>(null);

export function DashboardModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const mode = useSyncExternalStore(
    subscribeDashboardMode,
    readDashboardMode,
    () => DEFAULT_DASHBOARD_MODE
  );

  const setMode = useCallback((next: DashboardMode) => {
    writeDashboardMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    writeDashboardMode(mode === "simple" ? "advanced" : "simple");
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      isSimple: mode === "simple",
      isAdvanced: mode === "advanced",
      ready: true,
      setMode,
      toggleMode,
    }),
    [mode, setMode, toggleMode]
  );

  return (
    <DashboardModeContext.Provider value={value}>
      {children}
    </DashboardModeContext.Provider>
  );
}

export function useDashboardMode(): DashboardModeContextValue {
  const context = useContext(DashboardModeContext);
  if (!context) {
    throw new Error("useDashboardMode must be used within DashboardModeProvider");
  }
  return context;
}
