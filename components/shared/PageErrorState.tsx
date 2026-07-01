import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { PAGE_ERROR_FALLBACK } from "@/lib/copy/trust";
import { cn } from "@/lib/utils";

type PageErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function PageErrorState({
  message = PAGE_ERROR_FALLBACK,
  onRetry,
  retryLabel = "Try again",
  className,
}: PageErrorStateProps) {
  return (
    <main
      className={cn(
        "app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8",
        className
      )}
    >
      <EmptyState
        icon={AlertCircle}
        title="Something went wrong"
        description={message}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            {onRetry ? (
              <Button type="button" size="sm" onClick={onRetry}>
                {retryLabel}
              </Button>
            ) : null}
            <Button
              render={<Link href="/app" />}
              nativeButton={false}
              type="button"
              variant="outline"
              size="sm"
              className="border-white/10 bg-transparent text-slate-300"
            >
              Open dashboard
            </Button>
          </div>
        }
      />
    </main>
  );
}
