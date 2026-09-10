"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { getLaunchCopy } from "@/lib/onboarding/launch-copy";

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
  const { dict, locale } = useSaasTranslations();
  const t = getLaunchCopy(locale);
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
    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!loading && !disabled) void handleSubmit(); }}>
      <label htmlFor="onboarding-website" className="block text-sm font-medium text-slate-800">{t.url}</label>
      <input
        id="onboarding-website"
        type="text"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        spellCheck={false}
        required
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={o.websitePlaceholder}
        disabled={disabled || loading}
        className="min-h-12 min-w-0 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
      />
      <Button
        type="submit"
        disabled={disabled || loading}
        className="min-h-11 w-full sm:w-auto"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {t.start}
      </Button>
    </form>
  );
}
