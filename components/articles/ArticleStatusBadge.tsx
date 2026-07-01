import { cn } from "@/lib/utils";
import {
  Archive,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Lightbulb,
  XCircle,
} from "lucide-react";

type ArticleStatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof FileText }
> = {
  IDEA: {
    label: "Идея",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    icon: Lightbulb,
  },
  DRAFT: {
    label: "Черновик",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-300",
    icon: FileText,
  },
  WAITING_REVIEW: {
    label: "На проверке",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    icon: Clock,
  },
  APPROVED: {
    label: "Одобрено",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  WORDPRESS_DRAFT_CREATED: {
    label: "В WordPress",
    className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    icon: Globe,
  },
  PUBLISHED: {
    label: "Опубликовано",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    icon: CheckCircle2,
  },
  ARCHIVED: {
    label: "Архив",
    className: "border-slate-500/30 bg-slate-500/10 text-slate-400",
    icon: Archive,
  },
  FAILED: {
    label: "Ошибка",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
    icon: XCircle,
  },
};

export function ArticleStatusBadge({ status, className }: ArticleStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
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
