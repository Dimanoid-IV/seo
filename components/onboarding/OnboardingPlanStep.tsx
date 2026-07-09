"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type OnboardingPlanStepProps = {
  disabled?: boolean;
  onSuccess: () => Promise<void>;
  onError: (message: string) => void;
};

export function OnboardingPlanStep({
  disabled,
  onSuccess,
  onError,
}: OnboardingPlanStepProps) {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    onError("");

    try {
      const response = await authFetch("/api/autopilot/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        onError(
          await parseApiErrorMessage(response, o.errors.generatePlanFailed)
        );
        return;
      }

      const stepResponse = await authFetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "GENERATE_PLAN", action: "COMPLETE" }),
      });

      if (!stepResponse.ok) {
        onError(
          await parseApiErrorMessage(
            stepResponse,
            o.errors.planProgressSaveFailed
          )
        );
        return;
      }

      await onSuccess();
    } catch {
      onError(o.errors.generatePlanNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleGenerate()}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Rocket className="size-4" />
        )}
        {o.generatePlan}
      </Button>
      <Link href="/app/autopilot">
        <Button
          type="button"
          variant="outline"
          className="border-slate-200 bg-transparent text-slate-600"
        >
          {o.viewAutopilot}
        </Button>
      </Link>
    </div>
  );
}
