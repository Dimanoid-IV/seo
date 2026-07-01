import { BillingTrustNote } from "@/components/billing/BillingTrustNote";
import Link from "next/link";

import type { OnboardingViewModel } from "@/lib/onboarding/types";

type OnboardingBillingNoticeProps = {
  billing: NonNullable<OnboardingViewModel["billing"]>;
  actionLimitMessage?: string | null;
};

export function OnboardingBillingNotice({
  billing,
  actionLimitMessage,
}: OnboardingBillingNoticeProps) {
  const reached = billing.limits.find((item) => item.reached);

  return (
    <div className="space-y-3 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
      <div>
        <p className="text-sm font-medium text-violet-100">
          You&apos;re currently on the {billing.plan} plan.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          You can test RankBoost with limited usage. Upgrade anytime when you
          need more growth actions.
        </p>
      </div>

      <BillingTrustNote />

      {actionLimitMessage ? (
        <p className="text-sm text-amber-300">{actionLimitMessage}</p>
      ) : reached ? (
        <p className="text-sm text-amber-300">
          You&apos;ve reached the monthly limit for this action.{" "}
          <Link href="/app/billing" className="underline hover:text-amber-200">
            Upgrade to continue
          </Link>
          .
        </p>
      ) : billing.upgradeRecommended ? (
        <p className="text-sm text-slate-300">
          Need more audits or monthly plans?{" "}
          <Link href="/app/billing" className="text-violet-300 underline">
            View plans
          </Link>
        </p>
      ) : null}
    </div>
  );
}
