"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

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
  const { dict } = useSaasTranslations();
  const d = dict.dashboard;
  const primaryClass =
    "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.45)] transition hover:from-blue-600 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

  return (
    <section className="saas-card-primary">
      <p className="saas-eyebrow text-blue-300/70">{d.whatShouldIDo}</p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
        {title}
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
        {description}
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
                {dict.common.working}
              </>
            ) : (
              label
            )}
          </button>
        )}
        {secondaryLabel && secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex min-h-12 items-center justify-center gap-1 text-sm font-medium text-slate-400 transition hover:text-slate-200 sm:px-2"
          >
            {secondaryLabel}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
