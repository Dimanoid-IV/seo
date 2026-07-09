"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  loginPathForPlan,
  registerPathForPlan,
} from "@/lib/billing/plan-query";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type MarketingPlanAuthDialogProps = {
  open: boolean;
  plan: BillingPlanKey;
  onClose: () => void;
};

export function MarketingPlanAuthDialog({
  open,
  plan,
  onClose,
}: MarketingPlanAuthDialogProps) {
  const { dict } = useSaasTranslations();
  const copy = dict.pricing.authChoice;

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-auth-dialog-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={copy.close}
        >
          <X className="size-4" />
        </button>

        <h2
          id="plan-auth-dialog-title"
          className="pr-8 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{copy.text}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            render={<Link href={loginPathForPlan(plan)} />}
            nativeButton={false}
            className="min-h-11 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700"
          >
            {copy.login}
          </Button>
          <Button
            render={<Link href={registerPathForPlan(plan)} />}
            nativeButton={false}
            variant="outline"
            className="min-h-11 flex-1 rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          >
            {copy.register}
          </Button>
        </div>
      </div>
    </div>
  );
}
