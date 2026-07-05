"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

type NextBestActionCardProps = {
  title: string;
  description: string;
  label: string;
  href?: string;
  onAction?: () => void;
  loading?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
};

export function NextBestActionCard({
  title,
  description,
  label,
  href,
  onAction,
  loading,
  secondaryLabel,
  secondaryHref,
}: NextBestActionCardProps) {
  const primaryClass =
    "inline-flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section className="glass-card border border-blue-500/20 bg-blue-500/5 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-blue-300/80">
        Your next step
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {href ? (
          <Link href={href} className={primaryClass}>
            {label}
          </Link>
        ) : (
          <button
            type="button"
            className={primaryClass}
            onClick={onAction}
            disabled={loading || !onAction}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Working…
              </>
            ) : (
              label
            )}
          </button>
        )}
        {secondaryLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
