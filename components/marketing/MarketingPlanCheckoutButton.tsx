"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { BillingPlanKey } from "@/lib/billing/plans";

type MarketingPlanCheckoutButtonProps = {
  plan: BillingPlanKey;
  checkoutEnabled: boolean;
};

type CheckoutResponse = {
  data: { checkoutUrl: string };
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
  checkoutEnabled,
}: MarketingPlanCheckoutButtonProps) {
  const { dict } = useSaasTranslations();
  const { pricing, errors } = dict;
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await authFetch("/api/auth/me");
        if (!cancelled) {
          setAuthenticated(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
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

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, errors.billingRequired));
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

  if (!checkoutEnabled) {
    return (
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        {pricing.noCheckoutNote}
      </p>
    );
  }

  if (authenticated === null) {
    return (
      <Button type="button" disabled className="mt-4 min-h-10 w-full rounded-xl">
        {pricing.checkoutLoading}
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <div className="mt-4 space-y-2">
        <Link
          href="/login"
          className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {pricing.loginToUpgrade}
        </Link>
        <p className="text-center text-xs text-slate-400">{pricing.checkoutTrustNote}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <Button
        type="button"
        className="min-h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700"
        disabled={loading}
        onClick={() => void startCheckout()}
      >
        {loading ? pricing.checkoutLoading : planCheckoutLabel(plan, pricing)}
      </Button>
      {error ? (
        <p className="text-center text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-center text-xs text-slate-400">{pricing.checkoutTrustNote}</p>
      )}
    </div>
  );
}
