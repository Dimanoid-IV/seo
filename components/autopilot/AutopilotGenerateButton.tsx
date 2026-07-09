"use client";

import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AutopilotGenerateButtonProps = {
  loading: boolean;
  hasPlan: boolean;
  canRegenerate: boolean;
  blocked?: boolean;
  onGenerate: (forceRegenerate: boolean) => void;
};

export function AutopilotGenerateButton({
  loading,
  hasPlan,
  canRegenerate,
  blocked = false,
  onGenerate,
}: AutopilotGenerateButtonProps) {
  const { dict } = useSaasTranslations();
  const a = dict.autopilot;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        disabled={loading || blocked}
        onClick={() => onGenerate(false)}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        {hasPlan ? a.refreshPlan : a.generate}
      </Button>
      {hasPlan && canRegenerate ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading || blocked}
          onClick={() => onGenerate(true)}
          className="gap-2 border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="size-4" />
          {a.regenerate}
        </Button>
      ) : null}
    </div>
  );
}
