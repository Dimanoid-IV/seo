"use client";

import { cn } from "@/lib/utils";
import type { DashboardMode } from "@/lib/dashboard/mode";
import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type DashboardModeToggleProps = {
  className?: string;
  compact?: boolean;
  showHelper?: boolean;
};

export function DashboardModeToggle({
  className,
  compact = false,
  showHelper = true,
}: DashboardModeToggleProps) {
  const { dict } = useSaasTranslations();
  const { mode, setMode, ready } = useDashboardMode();
  const copy = dict.dashboardMode;

  function handleSelect(next: DashboardMode) {
    if (!ready || mode === next) {
      return;
    }
    setMode(next);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1",
          compact && "w-full"
        )}
        role="group"
        aria-label={copy.modeToggleLabel}
      >
        {(["simple", "advanced"] as const).map((value) => {
          const active = mode === value;
          const label = value === "simple" ? copy.simple : copy.advanced;

          return (
            <button
              key={value}
              type="button"
              disabled={!ready}
              onClick={() => handleSelect(value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm",
                active
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                  : "text-slate-600 hover:text-slate-900",
                !ready && "opacity-60"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {showHelper ? (
        <p className="text-[11px] leading-relaxed text-slate-500">
          {mode === "simple" ? copy.simpleHelper : copy.advancedHelper}
        </p>
      ) : null}
    </div>
  );
}
