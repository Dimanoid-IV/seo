"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { GeneratedFixPreview } from "@/components/dashboard/GeneratedFixPreview";
import { useDashboardOverview } from "@/components/dashboard/DashboardOverviewProvider";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageErrorState } from "@/components/shared/PageErrorState";
import { PageLoadingState } from "@/components/shared/PageLoadingState";
import { TrustNote } from "@/components/shared/TrustNote";
import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { HomeGeneratedFix, HomeTopIssue } from "@/lib/dashboard/home";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

const DASHBOARD_MAIN =
  "app-content mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCopyText(fix: HomeGeneratedFix): string {
  const parts: string[] = [];
  if (fix.metaTitle) {
    parts.push(`Title: ${fix.metaTitle}`);
  }
  if (fix.metaDescription) {
    parts.push(`Description: ${fix.metaDescription}`);
  }
  if (fix.contentHtml) {
    parts.push(stripHtml(fix.contentHtml));
  }
  return parts.join("\n\n");
}

function buildFixTopic(issue: HomeTopIssue, locale: string): string {
  if (locale === "ru") {
    return `Улучшение SEO: ${issue.title}`;
  }
  if (locale === "et") {
    return `SEO parandus: ${issue.title}`;
  }
  return `Homepage SEO improvement: ${issue.title}`;
}

export function SimpleDashboardPage() {
  const { dict, locale } = useSaasTranslations();
  const d = dict.dashboard;
  const h = dict.dashboard.homeFlow;
  const { home, loading, error, refetch } = useDashboardOverview();

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);

  useEffect(() => {
    if (home?.state !== "AUDIT_RUNNING") {
      return;
    }
    const intervalId = window.setInterval(() => {
      void refetch({ silent: true });
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [home?.state, refetch]);

  async function handleRunAudit() {
    if (!home?.website) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await authFetch(
        `/api/websites/${home.website.id}/audits/run`,
        { method: "POST" }
      );
      if (!response.ok) {
        setActionError(await parseApiErrorMessage(response, d.auditFailed));
        return;
      }
      await refetch({ silent: true });
    } catch {
      setActionError(d.auditNetworkError);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateFix() {
    if (!home?.website || !home.topIssue) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    setCopySuccess(false);
    setApproveSuccess(false);
    try {
      const response = await authFetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId: home.website.id,
          topic: buildFixTopic(home.topIssue, locale),
        }),
      });
      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          h.generateFailed
        );
        setActionError(message);
        return;
      }
      await refetch({ silent: true });
    } catch {
      setActionError(h.generateNetworkError);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopy(fix: HomeGeneratedFix) {
    try {
      await navigator.clipboard.writeText(buildCopyText(fix));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setActionError(h.copyFailed);
    }
  }

  async function handleApprove(fix: HomeGeneratedFix) {
    setActionLoading(true);
    setActionError(null);
    try {
      const response = await authFetch(`/api/articles/${fix.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!response.ok) {
        setActionError(await parseApiErrorMessage(response, h.approveFailed));
        return;
      }
      setApproveSuccess(true);
      await refetch({ silent: true });
    } catch {
      setActionError(h.approveNetworkError);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <PageLoadingState message={h.loading} />;
  }

  if (error || !home) {
    return (
      <PageErrorState
        message={error ?? dict.trust.pageErrorFallback}
        onRetry={() => void refetch()}
        retryLabel={dict.common.tryAgain}
      />
    );
  }

  if (home.state === "NO_WEBSITE") {
    return (
      <main className={DASHBOARD_MAIN}>
        <EmptyState
          icon={Globe}
          title={h.noWebsiteTitle}
          description={h.noWebsiteDescription}
          action={
            <Link
              href="/app/onboarding"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.45)] hover:from-blue-600 hover:to-violet-700"
            >
              {d.addWebsite}
            </Link>
          }
        />
      </main>
    );
  }

  const websiteLabel =
    home.website?.displayName ??
    home.website?.url.replace(/^https?:\/\//, "").replace(/\/$/, "") ??
    "";

  return (
    <main className={DASHBOARD_MAIN}>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {h.eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {websiteLabel}
        </h2>
        {home.latestAudit?.growthScore != null ? (
          <p className="mt-2 text-sm text-slate-400">
            {h.scoreLabel}: {home.latestAudit.growthScore}/100
          </p>
        ) : null}
      </header>

      {home.state === "AUDIT_RUNNING" ? (
        <section className="saas-card-primary text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-blue-400" />
          <h3 className="mt-4 text-lg font-semibold text-white">
            {h.auditRunningTitle}
          </h3>
          <p className="mt-2 text-sm text-slate-400">{h.auditRunningDescription}</p>
        </section>
      ) : null}

      {home.state === "NO_AUDIT" ? (
        <section className="saas-card-primary">
          <h3 className="text-xl font-semibold text-white">{h.noAuditTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {h.noAuditDescription}
          </p>
          {home.auditError ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {home.auditError}
            </p>
          ) : null}
          <div className="mt-7">
            <Button
              type="button"
              className="min-h-12 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 text-white hover:from-blue-600 hover:to-violet-700"
              onClick={() => void handleRunAudit()}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {h.checkingWebsite}
                </>
              ) : (
                h.runWebsiteCheck
              )}
            </Button>
          </div>
        </section>
      ) : null}

      {home.state === "NEEDS_FIX" && home.topIssue ? (
        <section className="saas-card-primary">
          <h3 className="text-xl font-semibold text-white">{h.needsFixTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {h.needsFixDescription}
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {h.topIssueLabel}
            </p>
            <p className="mt-2 font-medium text-white">{home.topIssue.title}</p>
            {home.topIssue.description ? (
              <p className="mt-2 text-sm text-slate-400">
                {home.topIssue.description}
              </p>
            ) : null}
          </div>
          <div className="mt-7">
            {home.hermesAvailable ? (
              <Button
                type="button"
                className="min-h-12 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 text-white hover:from-blue-600 hover:to-violet-700"
                onClick={() => void handleGenerateFix()}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {h.generatingFix}
                  </>
                ) : (
                  h.generateFirstFix
                )}
              </Button>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                {h.hermesUnavailable}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {home.state === "FIX_READY" && home.generatedFix ? (
        <section className="saas-card-primary">
          <h3 className="text-xl font-semibold text-white">{h.fixReadyTitle}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {h.fixReadyDescription}
          </p>
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="font-medium text-white">{home.generatedFix.title}</p>
            {home.generatedFix.metaDescription ? (
              <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                {home.generatedFix.metaDescription}
              </p>
            ) : null}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="mr-2 size-4" />
              {h.preview}
            </Button>
            <Button
              type="button"
              className="min-h-12 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 px-6 text-white hover:from-blue-600 hover:to-violet-700"
              onClick={() => void handleCopy(home.generatedFix!)}
            >
              {copySuccess ? (
                <>
                  <Check className="mr-2 size-4" />
                  {h.copySuccess}
                </>
              ) : (
                <>
                  <Copy className="mr-2 size-4" />
                  {h.copy}
                </>
              )}
            </Button>
            {home.generatedFix.status !== "APPROVED" ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-12 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                onClick={() => void handleApprove(home.generatedFix!)}
                disabled={actionLoading}
              >
                {approveSuccess ? (
                  <>
                    <Check className="mr-2 size-4" />
                    {h.approveSuccess}
                  </>
                ) : (
                  h.approve
                )}
              </Button>
            ) : null}
            {home.hermesAvailable ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-12 text-slate-400 hover:text-slate-200"
                onClick={() => void handleGenerateFix()}
                disabled={actionLoading}
              >
                <RefreshCw className="mr-2 size-4" />
                {h.regenerate}
              </Button>
            ) : null}
          </div>
          <GeneratedFixPreview
            fix={home.generatedFix}
            open={previewOpen}
            onOpenChange={setPreviewOpen}
          />
        </section>
      ) : null}

      {actionError ? (
        <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
          <button
            type="button"
            className="ml-3 underline hover:text-red-200"
            onClick={() => setActionError(null)}
          >
            {dict.common.close}
          </button>
        </div>
      ) : null}

      <div className="mt-8">
        <TrustNote variant="ai" />
      </div>
    </main>
  );
}
