"use client";

import { useCallback, useEffect, useState } from "react";

import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { BillingOverviewResponse } from "@/lib/billing/types";

type BillingOverviewState = {
  data: BillingOverviewResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useBillingOverview(): BillingOverviewState {
  const [data, setData] = useState<BillingOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/billing/subscription");

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, "Failed to load billing details")
        );
        setData(null);
        return;
      }

      const body = (await response.json()) as { data: BillingOverviewResponse };
      setData(body.data);
    } catch {
      setError("Network error while loading billing details");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadBilling() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch("/api/billing/subscription");

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, "Failed to load billing details")
            );
            setData(null);
          }
          return;
        }

        const body = (await response.json()) as { data: BillingOverviewResponse };
        if (!cancelled) {
          setData(body.data);
        }
      } catch {
        if (!cancelled) {
          setError("Network error while loading billing details");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBilling();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error, reload };
}

export function isUsageLimitReached(
  overview: BillingOverviewResponse | null,
  usageKey: string
): { blocked: boolean; message: string } {
  const item = overview?.usage.items.find((entry) => entry.key === usageKey);

  if (!item) {
    return { blocked: false, message: "" };
  }

  if (item.current >= item.limit) {
    return {
      blocked: true,
      message: `Monthly limit reached (${item.current}/${item.limit}). Upgrade to continue.`,
    };
  }

  return { blocked: false, message: "" };
}

export function isFeatureAvailable(
  overview: BillingOverviewResponse | null,
  feature: keyof BillingOverviewResponse["subscription"]["features"]
): { blocked: boolean; message: string } {
  const enabled = overview?.subscription.features[feature];

  if (enabled === false) {
    return {
      blocked: true,
      message: "Upgrade required for this feature.",
    };
  }

  return { blocked: false, message: "" };
}
