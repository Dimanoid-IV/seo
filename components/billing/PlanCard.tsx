"use client";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { BillingPlanViewModel } from "@/lib/billing/types";
import { cn } from "@/lib/utils";

type PlanCardProps = {
  plan: BillingPlanViewModel;
  checkoutLoading: boolean;
  onUpgrade: (planKey: string) => void;
  stripeConfigured: boolean;
};

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm text-slate-300">
      <Check
        className={cn(
          "size-4 shrink-0",
          enabled ? "text-emerald-400/90" : "text-slate-600"
        )}
      />
      <span className={enabled ? "" : "text-slate-500 line-through"}>
        {label}
      </span>
    </li>
  );
}

export function PlanCard({
  plan,
  checkoutLoading,
  onUpgrade,
  stripeConfigured,
}: PlanCardProps) {
  const { dict } = useSaasTranslations();
  const { billing, trust } = dict;
  const planKeyUpper = plan.key.toUpperCase();

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border p-6 sm:p-7",
        plan.isCurrent
          ? "border-violet-500/25 bg-gradient-to-br from-violet-500/[0.1] to-blue-500/[0.04] shadow-[0_8px_32px_-12px_rgba(139,92,246,0.2)]"
          : "border-white/[0.07] bg-white/[0.02]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-white">
            {plan.label}
          </h3>
          <p className="mt-1.5 text-sm text-slate-400">{plan.priceLabel}</p>
        </div>
        {plan.isCurrent ? (
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-200 ring-1 ring-violet-500/20">
            {billing.currentPlanBadge}
          </span>
        ) : null}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        <li className="text-sm text-slate-300">
          {plan.websites} {billing.websites.toLowerCase()}
        </li>
        <li className="text-sm text-slate-300">
          {plan.monthlyAudits} {billing.audits.toLowerCase()} / {billing.perMonth}
        </li>
        <li className="text-sm text-slate-300">
          {plan.monthlyAiGenerations} {billing.aiGenerations.toLowerCase()} /{" "}
          {billing.perMonth}
        </li>
        <li className="text-sm text-slate-300">
          {plan.monthlyArticles} {billing.articles.toLowerCase()} ·{" "}
          {plan.monthlySocialPosts} {billing.socialPosts.toLowerCase()}
        </li>
        <FeatureRow label={billing.planFeatures.wordpressDrafts} enabled={plan.features.wordpress} />
        <FeatureRow label={billing.planFeatures.controlCenter} enabled={plan.features.controlCenter} />
        <FeatureRow label={billing.planFeatures.emailSend} enabled={plan.features.emailSend} />
        <FeatureRow label={billing.planFeatures.advancedReports} enabled={plan.features.advancedReports} />
      </ul>

      <div className="mt-6 pt-2">
        {plan.isCurrent ? (
          <Button type="button" disabled className="min-h-11 w-full rounded-xl">
            {billing.currentPlanBadge}
          </Button>
        ) : plan.upgradeable ? (
          <Button
            type="button"
            className="min-h-11 w-full rounded-xl"
            disabled={checkoutLoading || !stripeConfigured}
            onClick={() => onUpgrade(planKeyUpper)}
          >
            {stripeConfigured ? billing.upgradePlan : trust.stripeNotConfigured}
          </Button>
        ) : null}
        {!stripeConfigured && plan.upgradeable && !plan.isCurrent ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
            {trust.stripeNotConfigured}
          </p>
        ) : null}
      </div>
    </article>
  );
}
