"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrustNote } from "@/components/shared/TrustNote";
import type { EmailApprovalViewModel } from "@/lib/email-approvals/types";

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
        <h2 className="text-lg font-semibold text-white">Review email draft</h2>
        <TrustNote variant="email" className="mt-4" />

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-white/10 bg-white/5"
              disabled={email.status === "sent"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-recipient">Recipient email</Label>
            <Input
              id="email-recipient"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Optional until sending"
              className="border-white/10 bg-white/5"
              disabled={email.status === "sent"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-body">Body</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
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
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || email.status === "approved"}
                className="border-emerald-500/30 text-emerald-300"
                onClick={onApprove}
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !canSend}
                title={
                  !emailSendingConfigured
                    ? "Email sending is not configured yet."
                    : undefined
                }
                onClick={() =>
                  onSend(recipientEmail.trim() || undefined)
                }
              >
                Send email manually
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                className="text-slate-400"
                onClick={onArchive}
              >
                Archive
              </Button>
            </>
          ) : null}
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        {!emailSendingConfigured ? (
          <p className="mt-4 text-xs text-slate-500">
            Email sending is not configured yet. You can still copy the email text
            manually.
          </p>
        ) : null}
      </div>
    </div>
  );
}
