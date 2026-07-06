"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureGate } from "@/components/billing/FeatureGate";
import {
  isUsageLimitReached,
  useBillingOverview,
} from "@/components/billing/useBillingOverview";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type {
  EmailApprovalViewModel,
  EmailApprovalsListResult,
} from "@/lib/email-approvals/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

import { EmailApprovalCard } from "./EmailApprovalCard";
import { EmailApprovalEditor } from "./EmailApprovalEditor";
import { EmailApprovalEmptyState } from "./EmailApprovalEmptyState";
import { EmailApprovalGenerateDialog } from "./EmailApprovalGenerateDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";

type EmailApprovalsResponse = {
  data: EmailApprovalsListResult;
};

const FILTER_KEYS = ["all", "ready", "approved", "sent", "draft"] as const;

export function EmailApprovalsPage() {
  const { dict, locale } = useSaasTranslations();
  const e = dict.emailApprovals;
  const { data: billing } = useBillingOverview();
  const emailLimit = isUsageLimitReached(billing, "email_approval");
  const [emails, setEmails] = useState<EmailApprovalViewModel[]>([]);
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [emailSendingConfigured, setEmailSendingConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionEmailId, setActionEmailId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<EmailApprovalViewModel | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: "30" });
      if (statusFilter !== "all") {
        params.set("status", statusFilter.toUpperCase());
      }

      try {
        const response = await authFetch(`/api/email-approvals?${params}`);

        if (!response.ok) {
          if (!cancelled) {
            setError(
              await parseApiErrorMessage(response, e.loadFailed)
            );
            setLoading(false);
          }
          return;
        }

        const body = (await response.json()) as EmailApprovalsResponse;
        if (!cancelled) {
          setEmails(body.data.emails);
          setWebsiteId(body.data.websiteId);
          setEmailSendingConfigured(body.data.emailSendingConfigured);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(e.loadNetworkError);
          setLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, locale, e.loadFailed, e.loadNetworkError]);

  const emptyVariant = useMemo(() => {
    if (!websiteId) {
      return "no-website" as const;
    }
    if (emails.length === 0) {
      return "no-emails" as const;
    }
    return null;
  }, [websiteId, emails.length]);

  async function handleGenerate(input: { type: string; source: string }) {
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authFetch("/api/email-approvals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, e.generateFailed)
        );
        return;
      }

      const body = (await response.json()) as { data: EmailApprovalViewModel };
      setEmails((prev) => [body.data, ...prev]);
      setGenerateOpen(false);
      setSuccess(e.draftCreated);
    } catch {
      setError(e.generateNetworkError);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSave(
    email: EmailApprovalViewModel,
    data: { subject: string; body: string; recipientEmail?: string }
  ) {
    setActionLoading(true);
    setActionEmailId(email.id);
    setError(null);

    try {
      const response = await authFetch(`/api/email-approvals/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, e.saveFailed));
        return;
      }

      const body = (await response.json()) as { data: EmailApprovalViewModel };
      setEmails((prev) =>
        prev.map((item) => (item.id === body.data.id ? body.data : item))
      );
      setEditingEmail(body.data);
      setSuccess(e.draftSaved);
    } catch {
      setError(e.saveNetworkError);
    } finally {
      setActionLoading(false);
      setActionEmailId(null);
    }
  }

  async function handleApprove(email: EmailApprovalViewModel) {
    setActionLoading(true);
    setActionEmailId(email.id);
    setError(null);

    try {
      const response = await authFetch(
        `/api/email-approvals/${email.id}/approve`,
        { method: "POST" }
      );

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, e.approveFailed));
        return;
      }

      const body = (await response.json()) as { data: EmailApprovalViewModel };
      setEmails((prev) =>
        prev.map((item) => (item.id === body.data.id ? body.data : item))
      );
      if (editingEmail?.id === body.data.id) {
        setEditingEmail(body.data);
      }
      setSuccess(e.approvedNotSent);
    } catch {
      setError(e.approveNetworkError);
    } finally {
      setActionLoading(false);
      setActionEmailId(null);
    }
  }

  async function handleArchive(email: EmailApprovalViewModel) {
    setActionLoading(true);
    setActionEmailId(email.id);
    setError(null);

    try {
      const response = await authFetch(`/api/email-approvals/${email.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, e.archiveFailed));
        return;
      }

      setEmails((prev) => prev.filter((item) => item.id !== email.id));
      if (editingEmail?.id === email.id) {
        setEditingEmail(null);
      }
    } catch {
      setError(e.archiveNetworkError);
    } finally {
      setActionLoading(false);
      setActionEmailId(null);
    }
  }

  async function handleSend(
    email: EmailApprovalViewModel,
    recipientEmail?: string
  ) {
    setActionLoading(true);
    setActionEmailId(email.id);
    setError(null);

    try {
      const response = await authFetch(`/api/email-approvals/${email.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      });

      if (!response.ok) {
        setError(
          await parseApiErrorMessage(response, e.sendFailed)
        );
        return;
      }

      const body = (await response.json()) as { data: EmailApprovalViewModel };
      setEmails((prev) =>
        prev.map((item) => (item.id === body.data.id ? body.data : item))
      );
      setEditingEmail(body.data);
      setSuccess(e.sentSuccess);
    } catch {
      setError(e.sendNetworkError);
    } finally {
      setActionLoading(false);
      setActionEmailId(null);
    }
  }

  if (loading && emails.length === 0) {
    return <PageLoadingState message={e.loading} />;
  }

  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={e.title}
        subtitle={e.subtitle}
        actions={
          websiteId ? (
            <FeatureGate blocked={emailLimit.blocked} reason={emailLimit.message}>
              <Button
                type="button"
                className="gap-2"
                disabled={emailLimit.blocked}
                onClick={() => setGenerateOpen(true)}
              >
                <Plus className="size-4" />
                {e.generate}
              </Button>
            </FeatureGate>
          ) : undefined
        }
      />

      <TrustNote variant="email" className="mb-6" />

      {websiteId ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_KEYS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                statusFilter === status
                  ? "bg-blue-500/20 text-blue-200"
                  : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {e.filters[status]}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      {emptyVariant ? (
        <div className="space-y-6">
          <EmailApprovalEmptyState variant={emptyVariant} />
          {emptyVariant === "no-emails" && websiteId ? (
            <div className="flex justify-center">
              <FeatureGate blocked={emailLimit.blocked} reason={emailLimit.message}>
                <Button
                  type="button"
                  className="gap-2"
                  disabled={emailLimit.blocked}
                  onClick={() => setGenerateOpen(true)}
                >
                  <Plus className="size-4" />
                  {e.generate}
                </Button>
              </FeatureGate>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {emails.map((email) => (
            <EmailApprovalCard
              key={email.id}
              email={email}
              actionEmailId={actionEmailId}
              onEdit={setEditingEmail}
              onApprove={handleApprove}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      <EmailApprovalGenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        loading={actionLoading}
        onGenerate={handleGenerate}
      />

      {editingEmail ? (
        <EmailApprovalEditor
          email={editingEmail}
          loading={actionLoading}
          emailSendingConfigured={emailSendingConfigured}
          onSave={(data) => void handleSave(editingEmail, data)}
          onApprove={() => void handleApprove(editingEmail)}
          onArchive={() => void handleArchive(editingEmail)}
          onSend={(recipientEmail) =>
            void handleSend(editingEmail, recipientEmail)
          }
          onClose={() => setEditingEmail(null)}
        />
      ) : null}
    </main>
  );
}
