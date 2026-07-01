"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

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
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!url.trim()) {
      onError("Enter your website URL to continue.");
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
        onError(await parseApiErrorMessage(response, "Could not add website"));
        return;
      }

      await onSuccess();
    } catch {
      onError("Network error while adding website");
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
        placeholder="https://yourwebsite.com"
        disabled={disabled || loading}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
      />
      <Button
        type="button"
        disabled={disabled || loading}
        onClick={() => void handleSubmit()}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Add website
      </Button>
    </div>
  );
}
