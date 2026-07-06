"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrustNote } from "@/components/shared/TrustNote";
import type { EmailApprovalViewModel } from "@/lib/email-approvals/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type EmailApprovalEditorProps = {
  email: EmailApprovalViewModel;
  loading: boolean;
  emailSendingConfigured: boolean;
  onSave: (data: {
    subject: string;
    body: string;
    recipientEmail?: string;
  }) => void;
  onApprove: () => void;
  onArchive: () => void;
  onSend: (recipientEmail?: string) => void;
  onClose: () => void;
};

export function EmailApprovalEditor({
  email,
  loading,
  emailSendingConfigured,
  onSave,
  onApprove,
  onArchive,
  onSend,
  onClose,
}: EmailApprovalEditorProps) {
  const { dict } = useSaasTranslations();
  const e = dict.emailApprovals;
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [recipientEmail, setRecipientEmail] = useState(
    email.recipientEmail ?? ""
  );

  const canSend =
    emailSendingConfigured &&
    email.status !== "sent" &&
    (email.status === "approved" || email.status === "ready");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">{e.reviewTitle}</h2>
        <TrustNote variant="email" className="mt-4" />

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">{e.subject}</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(ev) => setSubject(ev.target.value)}
              className="border-white/10 bg-white/5"
              disabled={email.status === "sent"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-recipient">{e.recipientEmail}</Label>
            <Input
              id="email-recipient"
              type="email"
              value={recipientEmail}
              onChange={(ev) => setRecipientEmail(ev.target.value)}
              placeholder={e.recipientPlaceholder}
              className="border-white/10 bg-white/5"
              disabled={email.status === "sent"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">{e.body}</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(ev) => setBody(ev.target.value)}
              rows={14}
              className="border-white/10 bg-white/5 font-mono text-sm"
              disabled={email.status === "sent"}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {email.status !== "sent" ? (
            <>
              <Button
                type="button"
                disabled={loading}
                onClick={() =>
                  onSave({
                    subject,
                    body,
                    recipientEmail: recipientEmail.trim() || undefined,
                  })
                }
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : e.saveChanges}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || email.status === "approved"}
                className="border-emerald-500/30 text-emerald-300"
                onClick={onApprove}
              >
                {e.approve}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !canSend}
                title={
                  !emailSendingConfigured ? e.sendNotConfigured : undefined
                }
                onClick={() =>
                  onSend(recipientEmail.trim() || undefined)
                }
              >
                {e.sendManually}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                className="text-slate-400"
                onClick={onArchive}
              >
                {e.archive}
              </Button>
            </>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            {e.close}
          </Button>
        </div>

        {!emailSendingConfigured ? (
          <p className="mt-4 text-xs text-slate-500">{e.sendNotConfiguredHint}</p>
        ) : null}
      </div>
    </div>
  );
}
