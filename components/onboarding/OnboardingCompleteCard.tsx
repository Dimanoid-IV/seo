"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type OnboardingCompleteCardProps = {
  onComplete: () => Promise<void>;
};

export function OnboardingCompleteCard({ onComplete }: OnboardingCompleteCardProps) {
  const router = useRouter();
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch("/api/onboarding/complete", {
        method: "POST",
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, o.errors.completeSetupFailed)
        );
        return;
      }

      await onComplete();
      router.push("/app/autopilot-control");
    } catch {
      setError(o.errors.completeSetupNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
      <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
      <h3 className="mt-4 text-xl font-semibold text-slate-900">{o.readyTitle}</h3>
      <p className="mt-2 text-sm text-slate-600">{o.readySubtitle}</p>
      <Button
        type="button"
        className="mt-5"
        disabled={loading}
        onClick={() => void handleComplete()}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {o.goToControlCenter}
      </Button>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
