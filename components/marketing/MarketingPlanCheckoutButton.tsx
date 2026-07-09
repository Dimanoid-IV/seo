"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import { friendlyApiErrorMessageForLocale } from "@/lib/copy/user-errors";
import {
  loginPathForPlan,
  onboardingPathForPlan,
  registerPathForPlan,
} from "@/lib/billing/plan-query";
import type { BillingPlanKey } from "@/lib/billing/plans";
import { getClientLocale } from "@/lib/i18n/saas/locale-state";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type MarketingPlanCheckoutButtonProps = {
  plan: BillingPlanKey;
  checkoutEnabled: boolean;
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

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; hasOrganization: boolean };

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
  checkoutEnabled,
}: MarketingPlanCheckoutButtonProps) {
  const { dict } = useSaasTranslations();
  const { pricing, errors } = dict;
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await authFetch("/api/auth/me");
        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setAuthState({ status: "guest" });
          return;
        }

        const body = (await response.json()) as {
          organization?: { id: string } | null;
        };

        setAuthState({
          status: "authenticated",
          hasOrganization: Boolean(body.organization?.id),
        });
      } catch {
        if (!cancelled) {
          setAuthState({ status: "guest" });
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase() }),
      });

      if (response.status === 401) {
        window.location.href = loginPathForPlan(plan);
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

  function handlePlanSelect() {
    if (authState.status === "loading" || loading) {
      return;
    }

    if (authState.status === "guest") {
      window.location.href = registerPathForPlan(plan);
      return;
    }

    if (!authState.hasOrganization) {
      window.location.href = onboardingPathForPlan(plan);
      return;
    }

    void startCheckout();
  }

  if (!checkoutEnabled) {
    return (
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        {pricing.noCheckoutNote}
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        className="min-h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
        disabled={authState.status === "loading" || loading}
        onClick={handlePlanSelect}
      >
        {loading || authState.status === "loading"
          ? pricing.checkoutLoading
          : planCheckoutLabel(plan, pricing)}
      </Button>
      {error ? (
        <p className="text-center text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-center text-xs text-slate-400">{pricing.checkoutTrustNote}</p>
      )}
    </div>
  );
}
