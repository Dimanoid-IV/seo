"use client";

import { useState } from "react";
import { CheckCircle2, HelpCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import type { AssistedSetupFormData } from "@/lib/validators";
import { cn } from "@/lib/utils";

type GscAssistedSetupIssueType = AssistedSetupFormData["issueType"];

type GscAssistedSetupFormProps = {
  defaultEmail?: string | null;
  defaultName?: string | null;
  defaultWebsiteUrl?: string | null;
  websiteId?: string | null;
  defaultIssueType?: GscAssistedSetupIssueType;
  sourcePage?: string;
  className?: string;
};

export function GscAssistedSetupPanel({
  defaultEmail,
  defaultName,
  defaultWebsiteUrl,
  websiteId,
  defaultIssueType = "NO_PROPERTY_FOUND",
  sourcePage = "/app/integrations",
  className,
}: GscAssistedSetupFormProps) {
  const { dict, locale } = useSaasTranslations();
  const a = dict.integrations.gscAssistedSetup;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <HelpCircle className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-slate-900">{a.title}</p>
          <p className="text-sm text-slate-600">{a.description}</p>
          {!expanded ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-slate-200 bg-white text-slate-700"
              onClick={() => setExpanded(true)}
            >
              {a.requestButton}
            </Button>
          ) : (
            <GscAssistedSetupForm
              defaultEmail={defaultEmail}
              defaultName={defaultName}
              defaultWebsiteUrl={defaultWebsiteUrl}
              websiteId={websiteId}
              defaultIssueType={defaultIssueType}
              sourcePage={sourcePage}
              locale={locale}
            />
          )}
          <p className="text-xs text-slate-500">{a.pricingHint}</p>
        </div>
      </div>
    </div>
  );
}

function GscAssistedSetupForm({
  defaultEmail,
  defaultName,
  defaultWebsiteUrl,
  websiteId,
  defaultIssueType,
  sourcePage,
  locale,
}: GscAssistedSetupFormProps & { locale: "ru" | "en" | "et" }) {
  const { dict } = useSaasTranslations();
  const a = dict.integrations.gscAssistedSetup;
  const [name, setName] = useState(defaultName ?? "");
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(defaultWebsiteUrl ?? "");
  const [issueType, setIssueType] = useState<GscAssistedSetupIssueType>(
    defaultIssueType ?? "NO_PROPERTY_FOUND"
  );
  const [comment, setComment] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const issueOptions: Array<{ value: GscAssistedSetupIssueType; label: string }> =
    [
      { value: "NO_PROPERTY_FOUND", label: a.issueNoProperty },
      { value: "NO_ACCESS", label: a.issueNoAccess },
      { value: "NOT_VERIFIED", label: a.issueNotVerified },
      { value: "NOT_SURE", label: a.issueNotSure },
      { value: "OTHER", label: a.issueOther },
    ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consentGiven) {
      setError(a.consentRequired);
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch("/api/integrations/assisted-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          websiteUrl: websiteUrl.trim(),
          integrationType: "GOOGLE_SEARCH_CONSOLE",
          issueType,
          comment: comment.trim() || undefined,
          consentGiven: true,
          locale,
          sourcePage,
          websiteId: websiteId ?? undefined,
        }),
      });

      if (!response.ok) {
        setError(await parseApiErrorMessage(response, a.submitFailed));
        return;
      }

      setSubmitted(true);
    } catch {
      setError(a.submitNetworkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <div className="flex items-start gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          <p>{a.successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="mt-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="gsc-help-name" className="text-xs text-slate-500">
            {a.nameLabel}
          </label>
          <Input
            id="gsc-help-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            className="border-slate-200 bg-white text-slate-900"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="gsc-help-email" className="text-xs text-slate-500">
            {a.emailLabel}
          </label>
          <Input
            id="gsc-help-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="border-slate-200 bg-white text-slate-900"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gsc-help-website" className="text-xs text-slate-500">
          {a.websiteLabel}
        </label>
        <Input
          id="gsc-help-website"
          type="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          required
          placeholder="https://example.com"
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gsc-help-issue" className="text-xs text-slate-500">
          {a.issueLabel}
        </label>
        <select
          id="gsc-help-issue"
          value={issueType}
          onChange={(event) =>
            setIssueType(event.target.value as GscAssistedSetupIssueType)
          }
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        >
          {issueOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="gsc-help-comment" className="text-xs text-slate-500">
          {a.commentLabel}
        </label>
        <textarea
          id="gsc-help-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(event) => setConsentGiven(event.target.checked)}
          className="mt-0.5 size-4 rounded border-slate-300"
        />
        <span>{a.consentLabel}</span>
      </label>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {a.submitting}
          </>
        ) : (
          a.submitButton
        )}
      </Button>
    </form>
  );
}
