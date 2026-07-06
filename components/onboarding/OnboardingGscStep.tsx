"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

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
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;

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
      onError(o.errors.skipStepFailed);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">{o.gscSkipHint}</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/app/integrations">
          <Button type="button" disabled={disabled}>
            {o.connectGsc}
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
          {o.skipGsc}
        </Button>
      </div>
    </div>
  );
}
