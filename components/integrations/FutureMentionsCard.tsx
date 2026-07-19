"use client";

/**
 * Disabled future card — mentions/partnerships later.
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
    <section className="mb-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 opacity-80">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {badge}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </section>
  );
}
