"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ActivityItem = {
  id: string;
  title: string;
  summary?: string;
  href?: string;
};

type RecentActivityCompactProps = {
  items: ActivityItem[];
};

export function RecentActivityCompact({ items }: RecentActivityCompactProps) {
  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">Recent activity</h3>
        <Link
          href="/app/timeline"
          className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
        >
          Open timeline
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          Important updates will appear here after audits, plans, or drafts.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-white/5">
          {items.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={item.href ?? "/app/timeline"}
                className="block hover:opacity-90"
              >
                <p className="text-sm font-medium text-slate-200">{item.title}</p>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {item.summary}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
