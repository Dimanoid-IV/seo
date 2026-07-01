import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type PageLoadingStateProps = {
  message?: string;
  className?: string;
};

export function PageLoadingState({
  message = "Loading…",
  className,
}: PageLoadingStateProps) {
  return (
    <main
      className={cn(
        "app-content mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8",
        className
      )}
    >
      <Loader2 className="size-8 animate-spin text-blue-400" />
      <p className="mt-3 text-sm text-slate-400">{message}</p>
    </main>
  );
}
