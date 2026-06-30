import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlanBadgeVariant = "demo" | "start" | "growth" | "pro" | "partner";

const variantStyles: Record<PlanBadgeVariant, string> = {
  demo: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  start: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  growth: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  pro: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  partner: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const variantLabels: Record<PlanBadgeVariant, string> = {
  demo: "Demo",
  start: "Start",
  growth: "Growth",
  pro: "Pro",
  partner: "Partner",
};

type PlanBadgeProps = {
  variant?: PlanBadgeVariant;
  label?: string;
  className?: string;
};

export function PlanBadge({
  variant = "demo",
  label,
  className,
}: PlanBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        variantStyles[variant],
        className
      )}
    >
      {label ?? variantLabels[variant]}
    </Badge>
  );
}
