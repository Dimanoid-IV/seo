import { cn } from "@/lib/utils";
import { CheckCircle2, Link2, Loader2, Unplug, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IntegrationStatus = "connected" | "connecting" | "disconnected" | "error";

type IntegrationStatusCardProps = {
  name: string;
  provider: string;
  status: IntegrationStatus;
  lastSync?: string;
  icon?: LucideIcon;
  className?: string;
};

const statusConfig: Record<
  IntegrationStatus,
  { icon: LucideIcon; label: string; className: string; dot: string }
> = {
  connected: {
    icon: CheckCircle2,
    label: "Подключено",
    className: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  connecting: {
    icon: Loader2,
    label: "Подключение…",
    className: "text-blue-400",
    dot: "bg-blue-400 animate-pulse",
  },
  disconnected: {
    icon: Unplug,
    label: "Не подключено",
    className: "text-slate-500",
    dot: "bg-slate-500",
  },
  error: {
    icon: XCircle,
    label: "Ошибка",
    className: "text-red-400",
    dot: "bg-red-400",
  },
};

export function IntegrationStatusCard({
  name,
  provider,
  status,
  lastSync,
  icon: ProviderIcon,
  className,
}: IntegrationStatusCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "glass-card flex items-center gap-4 p-4 transition-colors hover:border-slate-300",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
        {ProviderIcon ? (
          <ProviderIcon className="size-5 text-slate-600" />
        ) : (
          <Link2 className="size-5 text-slate-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">{provider}</p>
        {lastSync ? (
          <p className="mt-0.5 text-xs text-slate-600">Синхр.: {lastSync}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("size-2 rounded-full", config.dot)} aria-hidden />
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            config.className
          )}
        >
          <StatusIcon
            className={cn("size-3.5", status === "connecting" && "animate-spin")}
          />
          <span className="hidden sm:inline">{config.label}</span>
        </span>
      </div>
    </div>
  );
}
