import Link from "next/link";

import type { AutopilotFocusArea } from "@/lib/autopilot/types";

type FocusAreaCardProps = {
  area: AutopilotFocusArea;
};

const PRIORITY_STYLES: Record<string, string> = {
  HIGH: "border-red-400/30 bg-red-500/10 text-red-200",
  MEDIUM: "border-amber-400/30 bg-amber-500/10 text-amber-200",
  LOW: "border-slate-400/30 bg-slate-500/10 text-slate-300",
};

export function FocusAreaCard({ area }: FocusAreaCardProps) {
  const priorityClass = PRIORITY_STYLES[area.priority] ?? PRIORITY_STYLES.LOW;
  const hasLinks =
    (area.relatedArticleIds?.length ?? 0) > 0 ||
    (area.relatedSocialPostIds?.length ?? 0) > 0;

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-white">{area.title}</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityClass}`}
        >
          {area.priority}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{area.description}</p>
      <p className="mt-3 text-xs text-slate-500">{area.reason}</p>
      {hasLinks ? (
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {area.relatedArticleIds?.slice(0, 2).map((id) => (
            <Link
              key={id}
              href={`/app/articles/${id}`}
              className="text-blue-400 hover:text-blue-300"
            >
              Open article
            </Link>
          ))}
          {area.relatedSocialPostIds?.length ? (
            <Link
              href="/app/social-posts"
              className="text-blue-400 hover:text-blue-300"
            >
              View social posts
            </Link>
          ) : null}
          <Link href="/app" className="text-blue-400 hover:text-blue-300">
            Open dashboard
          </Link>
        </div>
      ) : null}
    </article>
  );
}
