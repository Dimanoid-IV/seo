import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FileText, Share2, Shield } from "lucide-react";

type ContentIdeaCardProps = {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  meta?: string;
  kind?: "article" | "social";
  href?: string;
  action?: ReactNode;
  qualityIndicator?: "passed" | "needs_review" | null;
  className?: string;
};

const kindIcons = {
  article: FileText,
  social: Share2,
};

export function ContentIdeaCard({
  title,
  subtitle,
  description,
  badge,
  meta,
  kind = "article",
  href,
  action,
  qualityIndicator = null,
  className,
}: ContentIdeaCardProps) {
  const Icon = kindIcons[kind];

  return (
    <article
      className={cn(
        "glass-card flex flex-col gap-3 border border-white/5 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
          <Icon className="size-4 text-blue-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {badge ? (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                {badge}
              </span>
            ) : null}
            {qualityIndicator ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                  qualityIndicator === "passed"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-amber-500/10 text-amber-300"
                )}
                title={
                  qualityIndicator === "passed"
                    ? "Проверено RankBoost"
                    : "Требует проверки"
                }
              >
                <Shield className="size-3" aria-hidden />
              </span>
            ) : null}
            {meta ? (
              <span className="text-xs text-slate-500">{meta}</span>
            ) : null}
          </div>
          <h3 className="mt-1 font-semibold text-white">
            {href ? (
              <Link href={href} className="hover:text-cyan-300">
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {description ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-auto pt-1">{action}</div> : null}
    </article>
  );
}
