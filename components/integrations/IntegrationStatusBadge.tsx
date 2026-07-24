import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Unplug,
  XCircle,
} from "lucide-react";

type IntegrationStatusBadgeProps = {
  status: string;
  comingSoon?: boolean;
  className?: string;
  /** Overrides the displayed label (e.g. localized partial-state text). */
  label?: string;
};

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  Connected: {
    label: "Connected",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  Disconnected: {
    label: "Disconnected",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: Unplug,
  },
  Connecting: {
    label: "Connecting",
    className: "border-blue-200 bg-blue-50 text-blue-800",
    icon: Clock,
  },
  Error: {
    label: "Error",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: XCircle,
  },
  Revoked: {
    label: "Revoked",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Unplug,
  },
  NeedsProperty: {
    label: "Select a site",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: AlertTriangle,
  },
};

export function IntegrationStatusBadge({
  status,
  comingSoon = false,
  className,
  label,
}: IntegrationStatusBadgeProps) {
  if (comingSoon) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700",
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
      {label ?? config.label}
    </span>
  );
}
