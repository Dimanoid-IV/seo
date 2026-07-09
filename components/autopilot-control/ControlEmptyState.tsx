"use client";

import { Gauge } from "lucide-react";

import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type ControlEmptyStateProps = {
  variant: "no-website" | "no-data" | "no-approvals" | "no-activity";
};

const VARIANT_KEY: Record<
  ControlEmptyStateProps["variant"],
  keyof import("@/lib/i18n/saas/types").SaasDictionary["controlCenter"]["emptyStates"]
> = {
  "no-website": "noWebsite",
  "no-data": "noData",
  "no-approvals": "noApprovals",
  "no-activity": "noActivity",
};

export function ControlEmptyState({ variant }: ControlEmptyStateProps) {
  const { dict } = useSaasTranslations();
  const copy = dict.controlCenter.emptyStates[VARIANT_KEY[variant]];

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <Gauge className="mx-auto mb-3 size-8 text-slate-500" />
      <h3 className="font-medium text-slate-900">{copy.title}</h3>
      <p className="mt-1 text-sm text-slate-400">{copy.description}</p>
    </div>
  );
}
