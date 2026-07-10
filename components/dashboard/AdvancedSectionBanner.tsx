"use client";

import { usePathname } from "next/navigation";

import { useDashboardMode } from "@/components/dashboard/DashboardModeProvider";
import { Button } from "@/components/ui/button";
import { isAdvancedAppRoute } from "@/lib/dashboard/mode";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

export function AdvancedSectionBanner() {
  const pathname = usePathname();
  const { isSimple, setMode, ready } = useDashboardMode();
  const { dict } = useSaasTranslations();
  const copy = dict.dashboardMode;

  if (!ready || !isSimple || !isAdvancedAppRoute(pathname)) {
    return null;
  }

  return (
    <div className="border-b border-violet-200 bg-violet-50/80 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-700">{copy.advancedSectionBanner}</p>
        <Button
          type="button"
          size="sm"
          className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
          onClick={() => setMode("advanced")}
        >
          {copy.enableAdvanced}
        </Button>
      </div>
    </div>
  );
}
