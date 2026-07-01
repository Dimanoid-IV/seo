"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";

import type { ArticleQualityIssuesSnapshot } from "@/lib/hermes/article-quality";
import { cn } from "@/lib/utils";

type ArticleQualityPanelProps = {
  qualityScore: number | null;
  qualityPassed: boolean | null;
  qualityIssuesJson: ArticleQualityIssuesSnapshot | null;
  className?: string;
};

function parseQualityIssues(
  value: unknown
): ArticleQualityIssuesSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ArticleQualityIssuesSnapshot;
}

export function ArticleQualityPanel({
  qualityScore,
  qualityPassed,
  qualityIssuesJson,
  className,
}: ArticleQualityPanelProps) {
  const [showIssues, setShowIssues] = useState(false);

  if (qualityScore === null && qualityPassed === null) {
    return null;
  }

  const snapshot =
    qualityIssuesJson ??
    parseQualityIssues(qualityIssuesJson);
  const score = qualityScore ?? snapshot?.score ?? 0;
  const passed = qualityPassed ?? snapshot?.passed ?? false;
  const items = snapshot?.items ?? [];

  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Quality Score
          </p>
          <p className="text-2xl font-bold text-white">
            {score}
            <span className="text-base font-normal text-slate-500"> / 100</span>
          </p>
        </div>

        {passed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            Проверено RankBoost
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <ShieldAlert className="size-3.5" />
            Требует проверки
          </span>
        )}
      </div>

      {items.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowIssues((current) => !current)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
          >
            {showIssues ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            Показать замечания
          </button>

          {showIssues ? (
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((item) => (
                <li
                  key={`${item.code}-${item.displayLabel}`}
                  className={cn(
                    "flex items-start gap-2",
                    item.status === "fixed"
                      ? "text-emerald-300"
                      : item.status === "warning"
                        ? "text-amber-300"
                        : "text-slate-400"
                  )}
                >
                  <span aria-hidden>
                    {item.status === "fixed"
                      ? "✓"
                      : item.status === "warning"
                        ? "⚠"
                        : "•"}
                  </span>
                  <span>{item.displayLabel}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
