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
        "glass-card flex flex-col items-center justify-center px-6 py-12 text-center",
        className
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/5">
          <Icon className="size-7 text-slate-500" />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-slate-400 sm:max-w-md">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
