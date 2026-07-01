"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";

type OnboardingGscStepProps = {
  disabled?: boolean;
  onSkip: () => void | Promise<void>;
  onError: (message: string) => void;
  skipping?: boolean;
};

export function OnboardingGscStep({
  disabled,
  onSkip,
  onError,
  skipping = false,
}: OnboardingGscStepProps) {
  async function handleSkip() {
    onError("");
    try {
      await authFetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "CONNECT_GSC", action: "SKIP" }),
      });
      await onSkip();
    } catch {
      onError("Could not skip this step");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        You can skip this step now and connect Search Console later from Integrations.
      </p>
      <div className="flex flex-wrap gap-2">
      <Link href="/app/integrations">
        <Button type="button" disabled={disabled}>
          Connect Search Console
        </Button>
      </Link>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || skipping}
        onClick={() => void handleSkip()}
        className="border-white/10 bg-transparent text-slate-300"
      >
        {skipping ? <Loader2 className="size-4 animate-spin" /> : null}
        Skip for now
      </Button>
      </div>
    </div>
  );
}
