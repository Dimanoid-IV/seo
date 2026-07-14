"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

import { GscAssistedSetupPanel } from "@/components/integrations/GscAssistedSetupForm";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type OnboardingGscStepProps = {
  disabled?: boolean;
  websiteUrl?: string | null;
  websiteId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  onSkip: () => void | Promise<void>;
  onError: (message: string) => void;
  skipping?: boolean;
};

export function OnboardingGscStep({
  disabled,
  websiteUrl,
  websiteId,
  userEmail,
  userName,
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
    <div className="space-y-4">
      <p className="text-sm text-slate-400">{o.gscSkipHint}</p>
      <p className="text-sm text-slate-500">{o.gscNeverAskPassword}</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/app/integrations">
          <Button type="button" disabled={disabled}>
            {dict.integrations.connectGscButton}
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || skipping}
          onClick={() => void handleSkip()}
          className="border-slate-200 bg-transparent text-slate-600"
        >
          {skipping ? <Loader2 className="size-4 animate-spin" /> : null}
          {o.skipGsc}
        </Button>
      </div>
      <GscAssistedSetupPanel
        defaultEmail={userEmail}
        defaultName={userName}
        defaultWebsiteUrl={websiteUrl}
        websiteId={websiteId}
        defaultIssueType="NOT_SURE"
        sourcePage="/app/onboarding"
      />
    </div>
  );
}
