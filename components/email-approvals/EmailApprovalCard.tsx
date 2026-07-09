"use client";

import type { EmailApprovalViewModel } from "@/lib/email-approvals/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

import {
  EmailApprovalStatusBadge,
  EmailApprovalTypeBadge,
} from "./EmailApprovalStatusBadge";

type EmailApprovalCardProps = {
  email: EmailApprovalViewModel;
  actionEmailId: string | null;
  onEdit: (email: EmailApprovalViewModel) => void;
  onApprove: (email: EmailApprovalViewModel) => void;
  onArchive: (email: EmailApprovalViewModel) => void;
};

export function EmailApprovalCard({
  email,
  actionEmailId,
  onEdit,
  onApprove,
  onArchive,
}: EmailApprovalCardProps) {
  const { dict } = useSaasTranslations();
  const e = dict.emailApprovals;
  const preview =
    email.body.length > 220 ? `${email.body.slice(0, 220)}…` : email.body;
  const isBusy = actionEmailId === email.id;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{email.subject}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <EmailApprovalTypeBadge type={email.type} />
            <EmailApprovalStatusBadge status={email.status} />
            <span className="text-xs text-slate-500">
              {new Date(email.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {email.recipientEmail ? (
        <p className="mt-2 text-xs text-slate-500">
          {e.toLabel} {email.recipientEmail}
        </p>
      ) : null}

      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-400">
        {preview}
      </pre>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isBusy || email.status === "sent"}
          onClick={() => onEdit(email)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {e.edit}
        </button>
        {email.status !== "approved" && email.status !== "sent" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onApprove(email)}
            className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {e.approve}
          </button>
        ) : null}
        {email.status !== "sent" && email.status !== "archived" ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onArchive(email)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-50 disabled:opacity-50"
          >
            {e.archive}
          </button>
        ) : null}
      </div>
    </article>
  );
}
