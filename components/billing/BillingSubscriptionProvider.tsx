"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authFetch } from "@/lib/auth/client-session";
import type { BillingSubscriptionViewModel } from "@/lib/billing/types";

export const BILLING_SUBSCRIPTION_UPDATED_EVENT =
  "rankboost:billing-subscription-updated";

type BillingSubscriptionContextValue = {
  subscription: BillingSubscriptionViewModel | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const BillingSubscriptionContext =
  createContext<BillingSubscriptionContextValue | null>(null);

async function fetchBillingSubscription(): Promise<BillingSubscriptionViewModel | null> {
  try {
    const response = await authFetch("/api/billing/subscription");

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as {
      data: { subscription: BillingSubscriptionViewModel };
    };

    return body.data.subscription;
  } catch {
    return null;
  }
}

export function notifyBillingSubscriptionUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(BILLING_SUBSCRIPTION_UPDATED_EVENT));
}

export function useBillingSubscription(): BillingSubscriptionContextValue {
  const context = useContext(BillingSubscriptionContext);
  if (!context) {
    throw new Error(
      "useBillingSubscription must be used within BillingSubscriptionProvider"
    );
  }
  return context;
}

export function BillingSubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscription, setSubscription] =
    useState<BillingSubscriptionViewModel | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const next = await fetchBillingSubscription();
    setSubscription(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialSubscription() {
      const next = await fetchBillingSubscription();
      if (!cancelled) {
        setSubscription(next);
        setLoading(false);
      }
    }

    void loadInitialSubscription();

    function handleUpdated() {
      void refetch();
    }

    window.addEventListener(BILLING_SUBSCRIPTION_UPDATED_EVENT, handleUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener(
        BILLING_SUBSCRIPTION_UPDATED_EVENT,
        handleUpdated
      );
    };
  }, [refetch]);

  const value = useMemo(
    () => ({
      subscription,
      loading,
      refetch,
    }),
    [subscription, loading, refetch]
  );

  return (
    <BillingSubscriptionContext.Provider value={value}>
      {children}
    </BillingSubscriptionContext.Provider>
  );
}
