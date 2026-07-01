import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillingPlanViewModel } from "@/lib/billing/types";

type PlanCardProps = {
  plan: BillingPlanViewModel;
  checkoutLoading: boolean;
  onUpgrade: (planKey: string) => void;
  stripeConfigured: boolean;
};

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-300">
      <Check
        className={enabled ? "size-4 text-emerald-400" : "size-4 text-slate-600"}
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
  const planKeyUpper = plan.key.toUpperCase();

  return (
    <article
      className={
        plan.isCurrent
          ? "rounded-2xl border border-violet-500/40 bg-violet-500/10 p-5"
          : "rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">{plan.label}</h3>
          <p className="mt-1 text-sm text-slate-400">{plan.priceLabel}</p>
        </div>
        {plan.isCurrent ? (
          <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-xs font-medium text-violet-200">
            Current
          </span>
        ) : null}
      </div>

      <ul className="mt-4 space-y-2">
        <li className="text-sm text-slate-300">{plan.websites} website(s)</li>
        <li className="text-sm text-slate-300">{plan.monthlyAudits} audits / month</li>
        <li className="text-sm text-slate-300">
          {plan.monthlyAiGenerations} AI generations / month
        </li>
        <li className="text-sm text-slate-300">
          {plan.monthlyArticles} articles · {plan.monthlySocialPosts} social posts
        </li>
        <FeatureRow label="WordPress drafts" enabled={plan.features.wordpress} />
        <FeatureRow label="Control Center" enabled={plan.features.controlCenter} />
        <FeatureRow label="Email send" enabled={plan.features.emailSend} />
        <FeatureRow label="Advanced reports" enabled={plan.features.advancedReports} />
      </ul>

      <div className="mt-5">
        {plan.isCurrent ? (
          <Button type="button" disabled className="w-full">
            Current plan
          </Button>
        ) : plan.upgradeable ? (
          <Button
            type="button"
            className="w-full"
            disabled={checkoutLoading || !stripeConfigured}
            onClick={() => onUpgrade(planKeyUpper)}
          >
            {stripeConfigured ? "Upgrade plan" : "Checkout unavailable"}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
