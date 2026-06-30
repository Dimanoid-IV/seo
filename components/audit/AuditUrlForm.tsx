"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { AuditLoadingSteps } from "@/components/audit/AuditLoadingSteps";
import { AuditPreviewResult } from "@/components/audit/AuditPreviewResult";
import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuditPreviewErrorMessage } from "@/lib/audit/client-messages";
import type {
  AuditPreviewResponse,
  AuditPreviewResponseData,
} from "@/lib/audit/preview-response";

type AuditUrlFormProps = {
  initialUrl?: string;
};

export function AuditUrlForm({ initialUrl = "" }: AuditUrlFormProps) {
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
      setError("Введите адрес сайта");
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
        setError(
          getAuditPreviewErrorMessage(
            response.status,
            body as {
              error?: {
                code?: string;
                message?: string;
                details?: { scannerError?: string };
              };
            }
          )
        );
        return;
      }

      if (!("data" in body) || !body.data) {
        setError("Сервер вернул неожиданный ответ");
        return;
      }

      setResult(body.data);
      setPreviewToken(body.previewToken ?? null);
    } catch {
      setError("Сетевая ошибка. Проверьте подключение и попробуйте снова");
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
        <div className="glass-card space-y-4 border border-white/10 p-6">
          <label htmlFor="audit-url" className="block text-sm font-medium text-slate-300">
            Адрес сайта
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <Input
                id="audit-url"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="example.com или https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={loading}
                className="h-11 border-white/10 bg-white/5 pl-10 text-base text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 shrink-0 bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white hover:from-blue-500 hover:to-violet-500"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Проверяем…
                </>
              ) : (
                "Проверить сайт бесплатно"
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Без регистрации. Preview Growth Score и главные рекомендации — результат
            можно сохранить после создания аккаунта.
          </p>
        </div>

        {error ? <AuthError message={error} /> : null}
      </form>

      <AuditLoadingSteps key={loadingKey} active={loading} />
    </div>
  );
}
