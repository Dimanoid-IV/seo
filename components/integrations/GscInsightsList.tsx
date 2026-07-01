import type { GscInsight } from "@/lib/integrations/gsc-types";
import { GSC_METRICS_EXPLAINER } from "@/lib/integrations/gsc-insights";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type GscInsightsListProps = {
  insights: GscInsight[];
  className?: string;
  compact?: boolean;
  showExplainer?: boolean;
};

const TYPE_STYLES: Record<
  GscInsight["type"],
  { icon: LucideIcon; border: string; bg: string; text: string }
> = {
  positive: {
    icon: TrendingUp,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-200",
  },
  opportunity: {
    icon: Lightbulb,
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-200",
  },
};

export function GscMetricsExplainer({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-2", className)}>
      <h4 className="text-sm font-semibold text-white">Что это значит</h4>
      <ul className="space-y-2 text-sm text-slate-400">
        {GSC_METRICS_EXPLAINER.map((item) => (
          <li key={item.label}>
            <span className="font-medium text-slate-300">{item.label}:</span>{" "}
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function GscInsightsList({
  insights,
  className,
  compact = false,
  showExplainer = false,
}: GscInsightsListProps) {
  if (insights.length === 0 && !showExplainer) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showExplainer ? <GscMetricsExplainer /> : null}

      {insights.length > 0 ? (
        <section className="space-y-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="size-4 text-violet-400" aria-hidden />
            Выводы за 28 дней
          </h4>
          <ul className="space-y-3">
            {insights.map((insight) => {
              const style = TYPE_STYLES[insight.type];
              const Icon = style.icon;

              return (
                <li
                  key={insight.code}
                  className={cn(
                    "rounded-lg border p-3",
                    style.border,
                    style.bg
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn("mt-0.5 size-4 shrink-0", style.text)}
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-1">
                      <p className={cn("text-sm font-medium", style.text)}>
                        {insight.title}
                      </p>
                      {!compact ? (
                        <p className="text-sm text-slate-300">
                          {insight.description}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-400">
                        {compact
                          ? insight.recommendation
                          : `Рекомендация: ${insight.recommendation}`}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
