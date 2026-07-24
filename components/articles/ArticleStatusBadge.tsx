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
    className: "border-violet-200 bg-violet-50 text-violet-700",
    icon: Lightbulb,
  },
  DRAFT: {
    label: "Черновик",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    icon: FileText,
  },
  WAITING_REVIEW: {
    label: "На проверке",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock,
  },
  APPROVED: {
    label: "Одобрено",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  WORDPRESS_DRAFT_CREATED: {
    label: "В WordPress",
    className: "border-cyan-200 bg-cyan-50 text-cyan-800",
    icon: Globe,
  },
  PUBLISHED: {
    label: "Опубликовано",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  ARCHIVED: {
    label: "Архив",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    icon: Archive,
  },
  FAILED: {
    label: "Ошибка",
    className: "border-red-200 bg-red-50 text-red-700",
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
