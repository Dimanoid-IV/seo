"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SaasCard, SaasSectionHeader } from "@/components/shared/SaasCard";

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
    <SaasCard variant="muted">
      <SaasSectionHeader
        title="Recent activity"
        action={
          <Link
            href="/app/timeline"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 transition hover:text-blue-200"
          >
            Open timeline
            <ArrowRight className="size-3" />
          </Link>
        }
      />
      {items.length === 0 ? (
        <p className="text-sm leading-relaxed text-slate-400">
          Important updates will appear here after audits, plans, or drafts.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href ?? "/app/timeline"}
                className="block rounded-lg px-1 py-3.5 transition hover:bg-white/[0.02]"
              >
                <p className="text-sm font-medium text-slate-200">{item.title}</p>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {item.summary}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SaasCard>
  );
}
