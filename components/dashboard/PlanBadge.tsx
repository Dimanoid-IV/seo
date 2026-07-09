import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlanBadgeVariant = "demo" | "start" | "growth" | "pro" | "partner";

const variantStyles: Record<PlanBadgeVariant, string> = {
  demo: "border-amber-200 bg-amber-50 text-amber-700",
  start: "border-blue-200 bg-blue-50 text-blue-700",
  growth: "border-cyan-200 bg-cyan-50 text-cyan-700",
  pro: "border-violet-200 bg-violet-50 text-violet-700",
  partner: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
