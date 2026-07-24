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
        "space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Quality Score
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {score}
            <span className="text-base font-normal text-slate-500"> / 100</span>
          </p>
        </div>

        {passed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="size-3.5" />
            Проверено RankBoost
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
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
                      ? "text-emerald-700"
                      : item.status === "warning"
                        ? "text-amber-700"
                        : "text-slate-600"
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
