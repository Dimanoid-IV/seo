"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, Mail } from "lucide-react";

import { CustomPublishingSetup } from "@/components/integrations/CustomPublishingSetup";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import type { UniversalExportPackage } from "@/lib/publishing/universal-export";

type ExportResponse = {
  data: {
    articleId: string;
    wordpressConnected: boolean;
    export: UniversalExportPackage;
  };
};

type ArticlePublishPanelProps = {
  articleId: string;
  wordpressConnected: boolean;
};

type CopyKey = "html" | "markdown" | "metaTitle" | "metaDescription" | "email";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Universal Publishing hub for an article: copy-ready blocks, downloads,
 * a developer email draft, and an optional webhook. Ensures a custom-site
 * article is never a dead-end even without a native integration.
 */
export function ArticlePublishPanel({
  articleId,
  wordpressConnected,
}: ArticlePublishPanelProps) {
  const [pkg, setPkg] = useState<UniversalExportPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [downloading, setDownloading] = useState<"html" | "md" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(`/api/articles/${articleId}/export`, {
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          if (!cancelled) setError("Не удалось подготовить материалы для публикации.");
          return;
        }
        const body = (await response.json()) as ExportResponse;
        if (!cancelled) setPkg(body.data.export);
      } catch {
        if (!cancelled) setError("Сетевая ошибка при подготовке материалов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  const handleCopy = useCallback(async (key: CopyKey, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(key);
      setTimeout(() => setCopied((current) => (current === key ? null : current)), 2000);
    }
  }, []);

  const handleDownload = useCallback(
    async (format: "html" | "md") => {
      setDownloading(format);
      try {
        const response = await authFetch(
          `/api/articles/${articleId}/export?format=${format}`,
          { signal: AbortSignal.timeout(15_000) }
        );
        if (!response.ok) return;
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${pkg?.slug ?? "article"}.${format === "md" ? "md" : "html"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      } finally {
        setDownloading(null);
      }
    },
    [articleId, pkg?.slug]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
        <Loader2 className="size-4 animate-spin" />
        Готовим материалы…
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-100">
        {error ?? "Материалы недоступны."}
      </div>
    );
  }

  const copyRow = (key: CopyKey, label: string, text: string) => (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={!text}
      onClick={() => void handleCopy(key, text)}
      className="justify-start border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
    >
      {copied === key ? (
        <Check className="size-4 text-emerald-300" />
      ) : (
        <Copy className="size-4" />
      )}
      {copied === key ? "Скопировано" : label}
    </Button>
  );

  const developerEmailText = `${pkg.developerEmail.subject}\n\n${pkg.developerEmail.body}`;
  const mailtoHref = `mailto:?subject=${encodeURIComponent(
    pkg.developerEmail.subject
  )}&body=${encodeURIComponent(pkg.developerEmail.body.slice(0, 1500))}`;

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Публикация статьи</h3>
        <p className="mt-1 text-xs text-slate-400">
          {wordpressConnected
            ? "1) WordPress: создайте черновик. 2) Webhook: если настроен и протестирован. 3) Универсальный пакет HTML/Markdown — запасной путь."
            : "1) Webhook для разработчика (если настроен). 2) Универсальный пакет HTML/Markdown / письмо разработчику."}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Скопировать
        </p>
        <div className="grid gap-2">
          {copyRow("html", "Скопировать HTML", pkg.copy.articleHtml)}
          {copyRow("markdown", "Скопировать Markdown", pkg.copy.articleMarkdown)}
          {copyRow("metaTitle", "Скопировать SEO title", pkg.copy.metaTitle)}
          {copyRow("metaDescription", "Скопировать meta description", pkg.copy.metaDescription)}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Скачать
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={downloading !== null}
            onClick={() => void handleDownload("html")}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            {downloading === "html" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Скачать HTML
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={downloading !== null}
            onClick={() => void handleDownload("md")}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            {downloading === "md" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Скачать Markdown
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Отправить разработчику
        </p>
        <div className="flex flex-wrap gap-2">
          {copyRow("email", "Скопировать письмо разработчику", developerEmailText)}
          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          >
            <Mail className="size-4" />
            Открыть письмо
          </a>
        </div>
        <p className="text-xs text-slate-500">
          Письмо не отправляется автоматически — вы отправляете его сами.
        </p>
      </div>

      <CustomPublishingSetup articleId={articleId} />
    </div>
  );
}
