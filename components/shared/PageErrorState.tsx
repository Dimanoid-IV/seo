"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";

type PageErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function PageErrorState({
  message,
  onRetry,
  retryLabel,
  className,
  secondaryHref,
  secondaryLabel,
}: PageErrorStateProps) {
  const { dict } = useSaasTranslations();

  return (
    <main
      className={cn(
        "app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        className
      )}
    >
      <EmptyState
        icon={AlertCircle}
        title={dict.common.somethingWrong}
        description={message ?? dict.trust.pageErrorFallback}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry ? (
              <Button type="button" size="sm" onClick={onRetry}>
                {retryLabel ?? dict.common.tryAgain}
              </Button>
            ) : null}
            {secondaryHref && secondaryLabel ? (
              <Button
                render={<Link href={secondaryHref} />}
                nativeButton={false}
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-200 bg-transparent text-slate-600"
              >
                {secondaryLabel}
              </Button>
            ) : null}
            <Button
              render={<Link href="/app" />}
              nativeButton={false}
              type="button"
              variant="outline"
              size="sm"
              className="border-slate-200 bg-transparent text-slate-600"
            >
              {dict.common.openDashboard}
            </Button>
          </div>
        }
      />
    </main>
  );
}
