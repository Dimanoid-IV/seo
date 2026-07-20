"use client";

import { Megaphone } from "lucide-react";

/**
 * Safe authority/community visibility card.
 * No backlink automation, no paid link scheme, no ranking guarantees.
 */
export function FutureMentionsCard({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <section className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Megaphone className="size-4 text-emerald-700" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          {badge}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-700">
        {description}
      </p>
    </section>
  );
}
