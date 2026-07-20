import Link from "next/link";
import {
  FileText,
  Megaphone,
  MessageCircle,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
} from "lucide-react";

import type {
  GrowthOpportunity,
  GrowthOpportunityEffort,
  GrowthOpportunityImpact,
  GrowthOpportunityType,
} from "@/lib/growth/types";
import { cn } from "@/lib/utils";

type GrowthOpportunityCardProps = {
  opportunity: GrowthOpportunity;
  onRunAudit?: () => void;
  auditLoading?: boolean;
  className?: string;
};

const TYPE_ICONS: Record<GrowthOpportunityType, typeof FileText> = {
  CONTENT: FileText,
  SEO: TrendingUp,
  TECHNICAL: Settings2,
  GSC: Search,
  AUTHORITY: Megaphone,
  COMMUNITY: MessageCircle,
  MAINTENANCE: RefreshCw,
};

const TYPE_LABELS: Record<GrowthOpportunityType, string> = {
  CONTENT: "Контент",
  SEO: "SEO",
  TECHNICAL: "Техника",
  GSC: "Search Console",
  AUTHORITY: "Упоминания",
  COMMUNITY: "Сообщества",
  MAINTENANCE: "Поддержка",
};

const IMPACT_LABELS: Record<GrowthOpportunityImpact, string> = {
  HIGH: "Высокий impact",
  MEDIUM: "Средний impact",
  LOW: "Низкий impact",
};

const EFFORT_LABELS: Record<GrowthOpportunityEffort, string> = {
  SMALL: "Малые усилия",
  MEDIUM: "Средние усилия",
  LARGE: "Большие усилия",
};

const IMPACT_STYLES: Record<GrowthOpportunityImpact, string> = {
  HIGH: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  MEDIUM: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  LOW: "border-slate-500/30 bg-slate-500/10 text-slate-600",
};

const EFFORT_STYLES: Record<GrowthOpportunityEffort, string> = {
  SMALL: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
  MEDIUM: "border-violet-500/30 bg-violet-500/10 text-violet-300",
  LARGE: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

function resolveCta(opportunity: GrowthOpportunity): {
  label: string;
  href?: string;
  action?: "audit";
} {
  switch (opportunity.type) {
    case "CONTENT":
      return { label: "Создать статью", href: "/app/content-plan" };
    case "TECHNICAL":
    case "SEO":
      return { label: "Запустить аудит", action: "audit" };
    case "GSC":
      return { label: "Открыть интеграции", href: "/app/integrations" };
    case "AUTHORITY":
      return { label: "Открыть план роста", href: "/app/autopilot" };
    case "COMMUNITY":
      return { label: "Подготовить ответы", href: "/app/content-plan" };
    case "MAINTENANCE":
    default:
      return { label: "Посмотреть", href: "/app/content-plan" };
  }
}

export function GrowthOpportunityCard({
  opportunity,
  onRunAudit,
  auditLoading = false,
  className,
}: GrowthOpportunityCardProps) {
  const Icon = TYPE_ICONS[opportunity.type];
  const cta = resolveCta(opportunity);

  return (
    <article
      className={cn(
        "glass-card flex flex-col gap-3 border border-slate-200 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <Icon className="size-4 text-blue-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-600">
              {TYPE_LABELS[opportunity.type]}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs",
                IMPACT_STYLES[opportunity.estimatedImpact]
              )}
            >
              {IMPACT_LABELS[opportunity.estimatedImpact]}
            </span>
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs",
                EFFORT_STYLES[opportunity.estimatedEffort]
              )}
            >
              {EFFORT_LABELS[opportunity.estimatedEffort]}
            </span>
          </div>
          <h3 className="mt-1 font-semibold text-slate-900">{opportunity.title}</h3>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-400">
        {opportunity.description}
      </p>

      <div className="mt-auto pt-1">
        {cta.action === "audit" ? (
          <button
            type="button"
            onClick={onRunAudit}
            disabled={auditLoading}
            className="inline-flex items-center rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cta.label}
          </button>
        ) : (
          <Link
            href={cta.href ?? "/app"}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </article>
  );
}
