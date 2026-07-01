"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmailApprovalGenerateDialogProps = {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  onGenerate: (input: { type: string; source: string }) => void;
};

const TYPE_OPTIONS = [
  { value: "MONTHLY_PLAN_REVIEW", label: "Monthly plan review", source: "MONTHLY_AUTOPILOT" },
  { value: "CONTENT_REVIEW", label: "Content review", source: "ARTICLE" },
  { value: "SOCIAL_POST_REVIEW", label: "Social post review", source: "SOCIAL_POST" },
  { value: "GROWTH_ALERT", label: "Growth alert", source: "SYSTEM" },
  { value: "INTEGRATION_ALERT", label: "Integration alert", source: "INTEGRATION" },
  { value: "GENERAL_REVIEW", label: "General review", source: "SYSTEM" },
];

export function EmailApprovalGenerateDialog({
  open,
  onClose,
  loading,
  onGenerate,
}: EmailApprovalGenerateDialogProps) {
  const [type, setType] = useState("GENERAL_REVIEW");

  if (!open) {
    return null;
  }

  const selected = TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Generate review email</h3>
        <p className="mt-1 text-sm text-slate-400">
          RankBoost will prepare an email draft from real data. Nothing is sent automatically.
        </p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm text-slate-300">Email type</span>
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
            Generate draft
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
