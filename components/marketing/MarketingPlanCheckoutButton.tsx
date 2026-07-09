"use client";

import { useState } from "react";

import { MarketingPlanAuthDialog } from "@/components/marketing/MarketingPlanAuthDialog";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import { fetchMarketingSession } from "@/lib/auth/marketing-session";
import { friendlyApiErrorMessageForLocale } from "@/lib/copy/user-errors";
import { onboardingPathForPlan } from "@/lib/billing/plan-query";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { getClientLocale } from "@/lib/i18n/saas/locale-state";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type MarketingPlanCheckoutButtonProps = {
  plan: BillingPlanKey;
};

type CheckoutResponse = {
  data: { checkoutUrl: string };
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: {
      billingError?: string;
    };
  };
};

function planCheckoutLabel(
  plan: BillingPlanKey,
  pricing: {
    chooseStarter: string;
    choosePro: string;
    chooseAgency: string;
  }
): string {
  if (plan === "STARTER") return pricing.chooseStarter;
  if (plan === "PRO") return pricing.choosePro;
  return pricing.chooseAgency;
}

export function MarketingPlanCheckoutButton({
  plan,
}: MarketingPlanCheckoutButtonProps) {
  const { dict } = useSaasTranslations();
  const { pricing, errors } = dict;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  async function startCheckout() {
    const session = await fetchMarketingSession();
    if (!session.authenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (!session.hasOrganization) {
      window.location.href = onboardingPathForPlan(plan);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase() }),
      });

      if (response.status === 401) {
        setAuthDialogOpen(true);
        return;
      }

      if (!response.ok) {
        let body: ApiErrorBody = {};
        try {
          body = (await response.json()) as ApiErrorBody;
        } catch {
          body = {};
        }

        const billingError = body.error?.details?.billingError;
        const code = body.error?.code;

        if (response.status === 404 || billingError === "ONBOARDING_REQUIRED") {
          window.location.href = onboardingPathForPlan(plan);
          return;
        }

        if (
          code === "BILLING_NOT_CONFIGURED" ||
          billingError === "BILLING_NOT_CONFIGURED"
        ) {
          setError(errors.billingUnavailable);
          return;
        }

        setError(
          friendlyApiErrorMessageForLocale(
            getClientLocale(),
            code,
            body.error?.message,
            errors.checkoutFailed,
            body.error?.details
          )
        );
        return;
      }

      const body = (await response.json()) as CheckoutResponse;
      window.location.href = body.data.checkoutUrl;
    } catch {
      setError(pricing.checkoutNetworkError);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanSelect() {
    if (loading) {
      return;
    }

    setError(null);

    const session = await fetchMarketingSession();
    if (!session.authenticated) {
      setAuthDialogOpen(true);
      return;
    }

    if (!session.hasOrganization) {
      window.location.href = onboardingPathForPlan(plan);
      return;
    }

    await startCheckout();
  }

  return (
    <>
      <div className="mt-4 space-y-2">
        <Button
          type="button"
          className="min-h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
          disabled={loading}
          onClick={() => void handlePlanSelect()}
        >
          {loading ? pricing.checkoutLoading : planCheckoutLabel(plan, pricing)}
        </Button>
        {error && !authDialogOpen ? (
          <p className="text-center text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-center text-xs text-slate-400">
            {pricing.checkoutTrustNote}
          </p>
        )}
      </div>

      <MarketingPlanAuthDialog
        open={authDialogOpen}
        plan={plan}
        onClose={() => setAuthDialogOpen(false)}
      />
    </>
  );
}
