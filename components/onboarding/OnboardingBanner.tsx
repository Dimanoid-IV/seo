"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { useOnboarding } from "@/components/onboarding/useOnboarding";
import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

export function OnboardingBanner() {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const { data, loading } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !data?.shouldShowSetup) {
    return null;
  }

  if (data.status === "COMPLETED") {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-blue-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
            <Sparkles className="size-4 text-violet-300" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{o.bannerTitle}</p>
            <p className="mt-1 text-sm text-slate-400">
              {o.bannerProgressDescription.replace(
                "{percent}",
                String(data.progress.percentage)
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/onboarding">
            <Button type="button" size="sm" className="gap-2">
              {o.bannerCta}
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-slate-400 hover:text-slate-700"
            onClick={() => setDismissed(true)}
            aria-label={o.dismissBannerAria}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
