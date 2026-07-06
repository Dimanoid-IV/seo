"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type EmailApprovalGenerateDialogProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onGenerate: (input: { type: string; source: string }) => void;
};

const TYPE_OPTIONS = [
  { value: "MONTHLY_PLAN_REVIEW", labelKey: "MONTHLY_PLAN_REVIEW" as const, source: "MONTHLY_AUTOPILOT" },
  { value: "CONTENT_REVIEW", labelKey: "CONTENT_REVIEW" as const, source: "ARTICLE" },
  { value: "SOCIAL_POST_REVIEW", labelKey: "SOCIAL_POST_REVIEW" as const, source: "SOCIAL_POST" },
  { value: "GROWTH_ALERT", labelKey: "GROWTH_ALERT" as const, source: "SYSTEM" },
  { value: "INTEGRATION_ALERT", labelKey: "INTEGRATION_ALERT" as const, source: "INTEGRATION" },
  { value: "GENERAL_REVIEW", labelKey: "GENERAL_REVIEW" as const, source: "SYSTEM" },
];

export function EmailApprovalGenerateDialog({
  open,
  onClose,
  loading,
  onGenerate,
}: EmailApprovalGenerateDialogProps) {
  const { dict } = useSaasTranslations();
  const e = dict.emailApprovals;
  const [type, setType] = useState("GENERAL_REVIEW");

  if (!open) {
    return null;
  }

  const selected = TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white">{e.generateTitle}</h3>
        <p className="mt-1 text-sm text-slate-400">{e.generateDescription}</p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm text-slate-300">{e.emailType}</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {e.generateTypes[option.labelKey]}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            disabled={loading}
            className="flex-1 gap-2"
            onClick={() =>
              onGenerate({ type: selected.value, source: selected.source })
            }
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {e.generateDraft}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {e.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
