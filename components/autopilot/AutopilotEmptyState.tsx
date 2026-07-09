"use client";

import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AutopilotEmptyStateProps = {
  variant: "no-website" | "no-data" | "no-plan";
};

export function AutopilotEmptyState({ variant }: AutopilotEmptyStateProps) {
  const { dict } = useSaasTranslations();
  const a = dict.autopilot;

  const copy =
    variant === "no-website"
      ? { title: a.emptyNoWebsiteTitle, description: a.emptyNoWebsiteDescription }
      : variant === "no-data"
        ? {
            title: a.emptyNoDataTitle,
            description: a.emptyNoDataDescription,
            action: { label: a.openIntegrations, href: "/app/integrations" },
          }
        : { title: a.emptyNoPlanTitle, description: a.emptyNoPlanDescription };

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-500/10">
        {variant === "no-plan" ? (
          <Sparkles className="size-7 text-violet-400" />
        ) : (
          <CalendarDays className="size-7 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{copy.title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{copy.description}</p>
      {"action" in copy && copy.action ? (
        <Link
          href={copy.action.href}
          className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          {copy.action.label}
        </Link>
      ) : null}
    </div>
  );
}
