import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "saas-card flex flex-col items-center justify-center px-8 py-14 text-center sm:py-16",
        className
      )}
    >
      {Icon ? (
        <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08]">
          <Icon className="size-7 text-slate-400" />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
        {title}
      </h3>
      {description ? (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  );
}
