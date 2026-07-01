import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Sparkles, Unplug, XCircle } from "lucide-react";

type IntegrationStatusBadgeProps = {
  status: string;
  comingSoon?: boolean;
  className?: string;
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  Connected: {
    label: "Connected",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  Disconnected: {
    label: "Disconnected",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    icon: Unplug,
  },
  Connecting: {
    label: "Connecting",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    icon: Clock,
  },
  Error: {
    label: "Error",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: XCircle,
  },
  Revoked: {
    label: "Revoked",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: Unplug,
  },
};

export function IntegrationStatusBadge({
  status,
  comingSoon = false,
  className,
}: IntegrationStatusBadgeProps) {
  if (comingSoon) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300",
          className
        )}
      >
        <Sparkles className="size-3" aria-hidden />
        Coming Soon
      </span>
    );
  }

  const config = STATUS_STYLES[status] ?? STATUS_STYLES.Disconnected;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="size-3" aria-hidden />
      {config.label}
    </span>
  );
}
