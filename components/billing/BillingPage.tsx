"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { notifyBillingSubscriptionUpdated } from "@/components/billing/BillingSubscriptionProvider";
import { BillingTrustNote } from "@/components/billing/BillingTrustNote";
import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { PlanCard } from "@/components/billing/PlanCard";
import { UsageLimitsCard } from "@/components/billing/UsageLimitsCard";
import { useBillingOverview } from "@/components/billing/useBillingOverview";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { friendlyApiErrorMessageForLocale } from "@/lib/copy/user-errors";
import { getClientLocale } from "@/lib/i18n/saas/locale-state";

type CheckoutResponse = {
  data: { checkoutUrl: string };
};

type PortalResponse = {
  data: { portalUrl: string };
};

export function BillingPage() {
  const searchParams = useSearchParams();
  const { dict } = useSaasTranslations();
  const { billing, trust, errors } = dict;
  const { data, loading, error, reload } = useBillingOverview();
  const { refetch: refetchDashboardOverview } = useDashboardOverview();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [syncingAfterCheckout, setSyncingAfterCheckout] = useState(false);
  const checkoutSyncStarted = useRef(false);

  useEffect(() => {
    if (searchParams.get("checkout") !== "success") {
      return;
    }

    if (checkoutSyncStarted.current) {
      return;
    }

    checkoutSyncStarted.current = true;
    let cancelled = false;

    async function syncAfterCheckout() {
      setSyncingAfterCheckout(true);
      setActionSuccess(null);
      setActionError(null);

      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (cancelled) {
          return;
        }

        try {
          const response = await authFetch("/api/billing/sync", {
            method: "POST",
          });

          if (response.ok) {
            const body = (await response.json()) as {
              data: { synced: boolean; plan?: string };
            };

            await reload();
            notifyBillingSubscriptionUpdated();
            void refetchDashboardOverview({ silent: true });

            if (!cancelled && body.data.synced) {
              setActionSuccess("Subscription updated.");
              setSyncingAfterCheckout(false);
              return;
            }
          }
        } catch {
          // Retry below.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }

      if (!cancelled) {
        await reload();
        notifyBillingSubscriptionUpdated();
        void refetchDashboardOverview({ silent: true });
        setActionSuccess(
          "Payment received. Your plan may take a moment to update."
        );
        setSyncingAfterCheckout(false);
      }
    }

    void syncAfterCheckout();

    return () => {
      cancelled = true;
    };
  }, [refetchDashboardOverview, reload, searchParams]);

  const canManageBilling = data?.subscription.canManageBilling ?? false;

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
          await parseApiErrorMessage(response, billing.checkoutFailed)
        );
        return;
      }

      const body = (await response.json()) as CheckoutResponse;
      window.location.href = body.data.checkoutUrl;
    } catch {
      setActionError(billing.checkoutNetworkError);
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
        const body = (await response.json()) as {
          error?: { code?: string; details?: { billingError?: string } };
        };
        const code = body.error?.code;
        const billingErrorCode = body.error?.details?.billingError;

        if (
          code === "BILLING_STATE_LEGACY_OR_INVALID" ||
          billingErrorCode === "BILLING_STATE_LEGACY_OR_INVALID"
        ) {
          await reload();
          notifyBillingSubscriptionUpdated();
          void refetchDashboardOverview({ silent: true });
          setActionError(errors.billingLegacySubscription);
          return;
        }

        setActionError(
          friendlyApiErrorMessageForLocale(
            getClientLocale(),
            code,
            undefined,
            billing.portalFailed,
            body.error?.details
          )
        );
        return;
      }

      const body = (await response.json()) as PortalResponse;
      window.location.href = body.data.portalUrl;
    } catch {
      setActionError(billing.portalNetworkError);
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading || syncingAfterCheckout) {
    return (
      <PageLoadingState
        message={syncingAfterCheckout ? "Updating your plan..." : billing.loading}
      />
    );
  }

  if (!data) {
    return (
      <PageErrorState
        message={error ?? billing.loadFailed}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="app-content mx-auto min-w-0 max-w-6xl saas-page-stack overflow-x-hidden p-4 sm:p-6 lg:p-10">
      <PageHeader title={billing.title} subtitle={billing.subtitle} />

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
        <TrustNote variant="info">{trust.stripeNotConfigured}</TrustNote>
      )}

      <CurrentPlanCard
        subscription={data.subscription}
        onManageBilling={() => void handleManageBilling()}
        managing={portalLoading}
        canManageBilling={canManageBilling}
      />

      <BillingTrustNote />

      <UsageLimitsCard usage={data.usage} />

      <section className="space-y-5">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {billing.availablePlans}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
