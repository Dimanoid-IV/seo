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
    <li className="flex items-center gap-2.5 text-sm text-slate-700">
      <Check
        className={cn(
          "size-4 shrink-0",
          enabled ? "text-emerald-600" : "text-slate-600"
        )}
      />
      <span className={enabled ? "" : "text-slate-400 line-through"}>
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
          ? "border-violet-200 bg-gradient-to-br from-violet-50/90 to-blue-50/50 shadow-[0_8px_30px_-12px_rgba(139,92,246,0.12)]"
          : "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">
            {plan.label}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600">{plan.priceLabel}</p>
        </div>
        {plan.isCurrent ? (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
            {billing.currentPlanBadge}
          </span>
        ) : null}
      </div>

      <ul className="mt-6 flex-1 space-y-2.5">
        <li className="text-sm text-slate-700">
          {plan.websites} {billing.websites.toLowerCase()}
        </li>
        <li className="text-sm text-slate-700">
          {plan.monthlyAudits} {billing.audits.toLowerCase()} / {billing.perMonth}
        </li>
        <li className="text-sm text-slate-700">
          {plan.monthlyAiGenerations} {billing.aiGenerations.toLowerCase()} /{" "}
          {billing.perMonth}
        </li>
        <li className="text-sm text-slate-700">
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
