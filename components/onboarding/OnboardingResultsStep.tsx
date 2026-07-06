"use client";

import { useState } from "react";
import Link from "next/link";
import { Gauge, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { OnboardingViewModel } from "@/lib/onboarding/types";

type OnboardingResultsStepProps = {
  results?: OnboardingViewModel["results"];
  disabled?: boolean;
  onViewed: () => Promise<void>;
};

export function OnboardingResultsStep({
  results,
  disabled,
  onViewed,
}: OnboardingResultsStepProps) {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const [loading, setLoading] = useState(false);

  async function markViewed() {
    setLoading(true);
    try {
      await authFetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "REVIEW_RESULTS", action: "VIEWED" }),
      });
      await onViewed();
    } finally {
      setLoading(false);
    }
  }

  if (!results?.growthScore && !results?.tasksCount) {
    return <p className="text-sm text-slate-400">{o.resultsPending}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0a0f1e]/60 p-3">
          <p className="text-xs text-slate-400">{o.growthScore}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {results.growthScore ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0f1e]/60 p-3">
          <p className="text-xs text-slate-400">{o.openTasks}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {results.tasksCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0a0f1e]/60 p-3">
          <p className="text-xs text-slate-400">{o.opportunities}</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {results.opportunitiesCount ?? 0}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/app/autopilot-control">
          <Button
            type="button"
            variant="outline"
            className="gap-2 border-white/10 bg-transparent text-slate-200"
          >
            <Gauge className="size-4" />
            {o.openControlCenter}
          </Button>
        </Link>
        <Button
          type="button"
          disabled={disabled || loading}
          onClick={() => void markViewed()}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {o.continueSetup}
        </Button>
      </div>
    </div>
  );
}
