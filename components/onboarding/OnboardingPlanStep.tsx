"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

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
          await parseApiErrorMessage(response, "Could not generate monthly plan")
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
            "Plan created but setup progress could not be saved"
          )
        );
        return;
      }

      await onSuccess();
    } catch {
      onError("Network error while generating plan");
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
        Generate plan
      </Button>
      <Link href="/app/autopilot">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-transparent text-slate-300"
        >
          View Autopilot
        </Button>
      </Link>
    </div>
  );
}
