"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type OnboardingWebsiteStepProps = {
  disabled?: boolean;
  onSuccess: () => Promise<void>;
  onError: (message: string) => void;
};

export function OnboardingWebsiteStep({
  disabled,
  onSuccess,
  onError,
}: OnboardingWebsiteStepProps) {
  const { dict } = useSaasTranslations();
  const o = dict.onboarding;
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!url.trim()) {
      onError(o.errors.websiteUrlRequired);
      return;
    }

    setLoading(true);
    onError("");

    try {
      const response = await authFetch("/api/onboarding/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        onError(await parseApiErrorMessage(response, o.errors.addWebsiteFailed));
        return;
      }

      await onSuccess();
    } catch {
      onError(o.errors.addWebsiteNetworkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={o.websitePlaceholder}
        disabled={disabled || loading}
        className="min-w-0 w-full rounded-xl border border-slate-200 border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500/50"
      />
      <Button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleSubmit()}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {o.addWebsite}
      </Button>
    </div>
  );
}
