"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import { cn } from "@/lib/utils";
import { setupCopy, wordpressProfileUrl } from "@/lib/integrations/setup-copy";

type WordPressConnectionFormProps = {
  integration: IntegrationOverviewItem;
  websiteId?: string | null;
  defaultSiteUrl?: string | null;
  onConnectionUpdated?: () => void;
  className?: string;
};

type ConnectResponse = {
  data: {
    tested: boolean;
    saved: boolean;
    siteUrl: string;
    httpsWarning: boolean;
    userLogin: string;
  };
};

/**
 * Non-technical WordPress connection via Application Password.
 * Never requests the WordPress admin password.
 */
export function WordPressConnectionForm({
  integration,
  websiteId,
  defaultSiteUrl,
  onConnectionUpdated,
  className,
}: WordPressConnectionFormProps) {
  const { dict, locale } = useSaasTranslations();
  const wp = dict.integrations.wordpress;
  const t = setupCopy(locale);
  const [step, setStep] = useState(0);

  const [siteUrl, setSiteUrl] = useState(
    integration.wordpress?.siteUrl || defaultSiteUrl || ""
  );
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [busy, setBusy] = useState<"test" | "save" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [httpsWarning, setHttpsWarning] = useState(false);
  const [, setTestPassed] = useState(false);
  const [saved, setSaved] = useState(false);
  const profileUrl = wordpressProfileUrl(siteUrl);

  const isConnected =
    saved || integration.connected ||
    integration.wordpress?.connectionStatus === "CONNECTED";

  async function callConnect(save: boolean) {
    if (!websiteId) {
      setError(wp.addWebsiteForKey);
      return;
    }
    if (!siteUrl.trim() || !username.trim() || !applicationPassword.trim()) {
      setError(wp.fillRequired);
      return;
    }

    setBusy(save ? "save" : "test");
    setError(null);
    setStatus(null);

    try {
      const response = await authFetch("/api/integrations/wordpress/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          siteUrl: siteUrl.trim(),
          username: username.trim(),
          applicationPassword: applicationPassword.trim(),
          save,
        }),
      });

      if (!response.ok) {
        setTestPassed(false);
        setError(
          await parseApiErrorMessage(
            response,
            save ? wp.saveFailed : wp.testFailed
          )
        );
        return;
      }

      const body = (await response.json()) as ConnectResponse;
      setHttpsWarning(body.data.httpsWarning);
      setTestPassed(true);
      setStatus(
        save
          ? wp.saveSuccess
          : wp.testSuccess(body.data.userLogin)
      );
      if (save) {
        setApplicationPassword("");
        setSaved(true);
        onConnectionUpdated?.();
      }
    } catch {
      setTestPassed(false);
      setError(wp.networkError);
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    if (!websiteId) return;
    setBusy("disconnect");
    setError(null);
    try {
      const response = await authFetch(
        "/api/integrations/wordpress/disconnect",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
        }
      );
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, wp.disconnectFailed));
        return;
      }
      setStatus(wp.disconnected);
      setSaved(false);
      setTestPassed(false);
      onConnectionUpdated?.();
    } catch {
      setError(wp.disconnectNetworkError);
    } finally {
      setBusy(null);
    }
  }

  if (isConnected) {
    return (
      <section
        className={cn(
          "space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4",
          className
        )}
      >
        <div className="flex items-start gap-2 text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">{wp.connected}</p>
            {integration.wordpress?.siteUrl ? (
              <p className="mt-1 text-xs text-slate-600">
                {integration.wordpress.siteUrl}
              </p>
            ) : null}
          </div>
        </div>

        <ul className="space-y-1 text-sm text-slate-700">
          <li>• {wp.createDraftsBullet}</li>
          <li>• {wp.livePublishBullet}</li>
          <li>• {wp.existingPageUpdatesBullet}</li>
        </ul>

        <p className="text-xs text-slate-600">{wp.livePublishSupportedNote}</p>
        <p className="text-xs font-medium text-slate-700">
          {wp.manualPublishNote}
        </p>
        <p className="text-xs text-slate-500">{wp.passwordHiddenNote}</p>
        <Link href="/app/content-plan" className="block text-sm font-medium text-violet-700 underline">{t.plan}</Link>

        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void handleDisconnect()}
        >
          {busy === "disconnect" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {wp.disconnect}
        </Button>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4",
        className
      )}
    >
      <ol className="grid grid-cols-3 gap-2" aria-label={wp.connectionTitle}>
        {t.steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={cn("border-t-4 pt-2 text-xs", index <= step ? "border-violet-500 text-violet-800" : "border-slate-200 text-slate-500")}>{index + 1}. {label}</li>)}
      </ol>
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-sky-700" />
        <div>
          <p className="text-sm font-medium text-slate-900">
            {t.steps[step]}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {step === 0 ? t.siteHelp : step === 1 ? wp.appPasswordGuideIntro : t.checkHelp}
          </p>
        </div>
      </div>

      {step === 1 && <div className="rounded-lg border border-sky-200 bg-white p-3">
        {profileUrl && <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="mb-4 block text-sm font-semibold text-violet-700 underline">{t.openProfile} ↗</a>}
        <p className="text-sm font-semibold text-slate-900">
          {wp.appPasswordGuideTitle}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          {wp.appPasswordGuideIntro}
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {wp.appPasswordSteps.slice(0, 5).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {wp.appPasswordSafetyNote}
        </p>
        <p className="mt-3 text-sm text-slate-600">{t.passwordHelp}</p>
      </div>}

      <div className="space-y-3">
        {step === 0 && <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {wp.siteUrlLabel}
          </span>
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => {
              setSiteUrl(e.target.value);
              setTestPassed(false);
            }}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </label>}
        {step === 2 && <><label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {wp.usernameLabel}
          </span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setTestPassed(false);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {wp.applicationPasswordLabel}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={applicationPassword}
            onChange={(e) => {
              setApplicationPassword(e.target.value);
              setTestPassed(false);
            }}
            placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
          <span className="text-[11px] text-slate-500">
            {wp.appPasswordGuideIntro}
          </span>
        </label></>}
      </div>

      {httpsWarning ? (
        <div className="flex items-start gap-2 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs">{wp.httpsWarning}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {step > 0 && <Button type="button" variant="outline" disabled={busy !== null} onClick={() => { setStep(step - 1); setError(null); }}>{t.back}</Button>}
        {step < 2 ? <Button type="button" onClick={() => {
          if (!profileUrl) { setError(t.invalidUrl); return; }
          setError(null); setStep(step + 1);
        }}>{step === 1 ? t.passwordReady : t.next}</Button> : <>
        <Button
          type="button"
          disabled={busy !== null || !websiteId}
          onClick={() => void callConnect(true)}
        >
          {busy === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {t.connect}
        </Button>
        </>}
      </div>

      {!websiteId ? (
        <p className="text-xs text-amber-700">{wp.addWebsiteForKey}</p>
      ) : null}
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
    </section>
  );
}
