"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

type OnboardingAuditStepProps = {
  websiteId?: string;
  disabled?: boolean;
  onSuccess: () => Promise<void>;
  onError: (message: string) => void;
};

export function OnboardingAuditStep({
  websiteId,
  disabled,
  onSuccess,
  onError,
}: OnboardingAuditStepProps) {
  const [loading, setLoading] = useState(false);

  async function handleRunAudit() {
    if (!websiteId) {
      onError("Add your website first.");
      return;
    }

    setLoading(true);
    onError("");

    try {
      const response = await authFetch(
        `/api/websites/${websiteId}/audits/run`,
        { method: "POST" }
      );

      if (!response.ok) {
        onError(await parseApiErrorMessage(response, "Could not run audit"));
        return;
      }

      await authFetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "RUN_AUDIT", action: "COMPLETE" }),
      });

      await onSuccess();
    } catch {
      onError("Network error while running audit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={disabled || loading || !websiteId}
      onClick={() => void handleRunAudit()}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Search className="size-4" />
      )}
      Run audit
    </Button>
  );
}
