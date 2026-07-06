"use client";

import { useMemo, useState } from "react";

import { BillingTrustNote } from "@/components/billing/BillingTrustNote";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { PlanCard } from "@/components/billing/PlanCard";
import { UsageLimitsCard } from "@/components/billing/UsageLimitsCard";
import { useBillingOverview } from "@/components/billing/useBillingOverview";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { STRIPE_NOT_CONFIGURED_COPY } from "@/lib/copy/trust";

type CheckoutResponse = {
  data: { checkoutUrl: string };
};

type PortalResponse = {
  data: { portalUrl: string };
};

export function BillingPage() {
  const { data, loading, error, reload } = useBillingOverview();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManageBilling = useMemo(() => {
    if (!data) {
      return false;
    }

    return data.subscription.plan !== "free";
  }, [data]);

  async function handleUpgrade(planKey: string) {
    setCheckoutLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await authFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!response.ok) {
        setActionError(
          await parseApiErrorMessage(response, "Could not start checkout")
        );
        return;
      }

      const body = (await response.json()) as CheckoutResponse;
      window.location.href = body.data.checkoutUrl;
    } catch {
      setActionError("Network error while starting checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await authFetch("/api/billing/portal", {
        method: "POST",
      });

      if (!response.ok) {
        setActionError(
          await parseApiErrorMessage(response, "Could not open billing portal")
        );
        return;
      }

      const body = (await response.json()) as PortalResponse;
      window.location.href = body.data.portalUrl;
    } catch {
      setActionError("Network error while opening billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return <PageLoadingState message="Loading billing details…" />;
  }

  if (!data) {
    return (
      <PageErrorState
        message={error ?? "We couldn't load billing details right now."}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="app-content mx-auto min-w-0 max-w-6xl space-y-6 overflow-x-hidden p-4 lg:p-8">
      <PageHeader
        title="Billing & Plan"
        subtitle="Manage your RankBoost subscription. Upgrade when you need more growth actions."
      />

      {actionError ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {actionError}
        </p>
      ) : null}

      {actionSuccess ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {actionSuccess}
        </p>
      ) : null}

      {data.subscription.stripeConfigured ? null : (
        <TrustNote variant="info">{STRIPE_NOT_CONFIGURED_COPY}</TrustNote>
      )}

      <CurrentPlanCard
        subscription={data.subscription}
        onManageBilling={() => void handleManageBilling()}
        managing={portalLoading}
        canManageBilling={canManageBilling}
      />

      <BillingTrustNote />

      <UsageLimitsCard usage={data.usage} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Available plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              checkoutLoading={checkoutLoading}
              stripeConfigured={data.subscription.stripeConfigured}
              onUpgrade={(planKey) => void handleUpgrade(planKey)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
