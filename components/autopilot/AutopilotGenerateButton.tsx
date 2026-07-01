import { Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

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
        {hasPlan ? "Refresh plan" : "Generate plan"}
      </Button>
      {hasPlan && canRegenerate ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading || blocked}
          onClick={() => onGenerate(true)}
          className="gap-2 border-white/10 bg-transparent text-slate-200 hover:bg-white/5"
        >
          <RefreshCw className="size-4" />
          Regenerate
        </Button>
      ) : null}
    </div>
  );
}
