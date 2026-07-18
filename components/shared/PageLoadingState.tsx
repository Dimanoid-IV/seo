"use client";

import { Loader2 } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type PageLoadingStateProps = {
  message?: string;
  className?: string;
};

export function PageLoadingState({ message, className }: PageLoadingStateProps) {
  const { dict } = useSaasTranslations();
  const resolvedMessage = message ?? dict.common.loading;
  return (
    <main
      className={cn(
        "app-content mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        className
      )}
    >
      <div className="flex items-center gap-3 text-slate-400">
        <Loader2 className="size-6 shrink-0 animate-spin text-blue-400" />
        <p className="text-sm">{resolvedMessage}</p>
      </div>
    </main>
  );
}
