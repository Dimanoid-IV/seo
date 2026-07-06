"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { AuditLoadingSteps } from "@/components/audit/AuditLoadingSteps";
import { AuditPreviewResult } from "@/components/audit/AuditPreviewResult";
import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditPreviewErrorMessage, type ApiErrorPayload } from "@/lib/audit/client-messages";
import type {
  AuditPreviewResponse,
  AuditPreviewResponseData,
} from "@/lib/audit/preview-response";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

type AuditUrlFormProps = {
  initialUrl?: string;
};

export function AuditUrlForm({ initialUrl = "" }: AuditUrlFormProps) {
  const { dict, locale } = useSaasTranslations();
  const a = dict.publicAudit;
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AuditPreviewResponseData | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setPreviewToken(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError(a.errors.emptyUrl);
      return;
    }

    setLoading(true);
    setLoadingKey((current) => current + 1);

    try {
      const response = await fetch("/api/audit/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const body = (await response.json()) as
        | AuditPreviewResponse
        | {
            error?: {
              code?: string;
              message?: string;
              details?: { scannerError?: string };
            };
          };

      if (!response.ok) {
        setError(getAuditPreviewErrorMessage(response.status, body as ApiErrorPayload, locale));
        return;
      }

      if (!("data" in body) || !body.data) {
        setError(a.errors.unexpectedResponse);
        return;
      }

      setResult(body.data);
      setPreviewToken(body.previewToken ?? null);
    } catch {
      setError(a.errors.networkError);
    } finally {
      setLoading(false);
    }
  }

  function handleCheckAnother() {
    setResult(null);
    setPreviewToken(null);
    setError("");
    setUrl("");
  }

  if (result) {
    return (
      <AuditPreviewResult
        data={result}
        previewToken={previewToken}
        onCheckAnother={handleCheckAnother}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="marketing-card space-y-4 p-6">
          <label htmlFor="audit-url" className="block text-sm font-medium text-slate-700">
            {a.urlLabel}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                id="audit-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder={a.urlPlaceholder}
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={loading}
                className="h-11 border-slate-200 bg-white pl-10 text-base text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white hover:from-blue-500 hover:to-violet-500"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {a.running}
                </>
              ) : (
                a.runPreview
              )}
            </Button>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">{a.trustNote}</p>
        </div>

        {error ? <AuthError message={error} /> : null}
      </form>

      <AuditLoadingSteps key={loadingKey} active={loading} />
    </div>
  );
}
