"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Loader2, Mail, Send, Webhook } from "lucide-react";

import { CustomPublishingSetup } from "@/components/integrations/CustomPublishingSetup";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-session";
import type { UniversalExportPackage } from "@/lib/publishing/universal-export";
import { resolveArticlePublishPriority } from "@/lib/publishing/custom-publishing-display";

type ExportResponse = {
  data: {
    articleId: string;
    wordpressConnected: boolean;
    webhookTested: boolean;
    customPublishing?: {
      connected: boolean;
      tested: boolean;
      hostLabel: string | null;
      hasSharedSecret: boolean;
      connectedBanner: string | null;
    };
    export: UniversalExportPackage;
  };
};

type ArticlePublishPanelProps = {
  articleId: string;
  wordpressConnected: boolean;
  articleStatus?: string;
  wordpressPostId?: string | null;
  wordpressPublishedUrl?: string | null;
  wordpressEditUrl?: string | null;
  onRolledBack?: () => void;
};

type CopyKey = "html" | "markdown" | "metaTitle" | "metaDescription" | "email";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through
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
 * Universal Publishing hub + RankBoost live rollback when published (11.53).
 */
export function ArticlePublishPanel({
  articleId,
  wordpressConnected,
  articleStatus,
  wordpressPostId,
  wordpressPublishedUrl,
  wordpressEditUrl,
  onRolledBack,
}: ArticlePublishPanelProps) {
  const [webhookTested, setWebhookTested] = useState(false);
  const publishPriority = resolveArticlePublishPriority({
    wordpressConnected,
    webhookTested,
  });
  const [pkg, setPkg] = useState<UniversalExportPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const [downloading, setDownloading] = useState<"html" | "md" | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackMessage, setRollbackMessage] = useState<string | null>(null);
  const [customHost, setCustomHost] = useState<string | null>(null);
  const [customConnected, setCustomConnected] = useState(false);
  const [publishing, setPublishing] = useState<"test" | "send" | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const isLivePublished =
    articleStatus === "PUBLISHED" && Boolean(wordpressPostId);

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
          if (!cancelled) {
            setError("Не удалось подготовить материалы для публикации.");
          }
          return;
        }
        const body = (await response.json()) as ExportResponse;
        if (!cancelled) {
          setPkg(body.data.export);
          setWebhookTested(body.data.webhookTested === true);
          setCustomConnected(body.data.customPublishing?.connected === true);
          setCustomHost(body.data.customPublishing?.hostLabel ?? null);
        }
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
      setTimeout(
        () => setCopied((current) => (current === key ? null : current)),
        2000
      );
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

  async function handleRollback() {
    if (
      !window.confirm(
        "Move this WordPress post back to draft? The post will not be deleted."
      )
    ) {
      return;
    }
    setRollingBack(true);
    setRollbackMessage(null);
    try {
      const response = await authFetch(
        `/api/articles/${articleId}/wordpress-rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetStatus: "draft" }),
        }
      );
      if (!response.ok) {
        setRollbackMessage("Could not move the WordPress post to draft.");
        return;
      }
      setRollbackMessage("WordPress post moved to draft.");
      onRolledBack?.();
    } catch {
      setRollbackMessage("Network error while rolling back.");
    } finally {
      setRollingBack(false);
    }
  }

  async function handleCustomPublish(dryRun: boolean) {
    setPublishing(dryRun ? "test" : "send");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/custom-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: {
          delivered?: boolean;
          statusCode?: number;
          error?: string | null;
        };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить подключение сайта."
              : "Не удалось опубликовать статью на сайте.")
        );
        return;
      }
      if (body.data?.delivered) {
        setPublishMessage(
          dryRun
            ? `Связь с ${customHost ?? "сайтом"} работает.`
            : `Статья отправлена на ${customHost ?? "сайт"}. Она появится после деплоя сайта.`
        );
      } else {
        setPublishError(
          body.data?.error ??
            `Сайт ответил статусом ${body.data?.statusCode ?? "unknown"}.`
        );
      }
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке сайта."
          : "Сетевая ошибка при отправке статьи."
      );
    } finally {
      setPublishing(null);
    }
  }

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
      {isLivePublished ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-50">
          <p className="font-semibold text-emerald-100">Published on WordPress</p>
          {wordpressPublishedUrl ? (
            <p className="mt-1 break-all">
              <a
                href={wordpressPublishedUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {wordpressPublishedUrl}
              </a>
            </p>
          ) : null}
          {wordpressEditUrl ? (
            <p className="mt-1 text-emerald-200/80">
              Edit:{" "}
              <a
                href={wordpressEditUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                open in WordPress
              </a>
            </p>
          ) : null}
          <p className="mt-2 text-amber-100">
            Moving back to draft changes the WordPress post status. The post is
            not deleted.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 border-white/20"
            disabled={rollingBack}
            onClick={() => void handleRollback()}
          >
            {rollingBack ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Move back to draft
          </Button>
          {rollbackMessage ? (
            <p className="mt-2 text-emerald-100">{rollbackMessage}</p>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-white">Публикация статьи</h3>
        <p className="mt-1 text-xs text-slate-400">
          {publishPriority === "wordpress_draft"
            ? "WordPress подключён: RankBoost может создать черновик или публиковать через автопилот, если это разрешено в плане."
            : publishPriority === "webhook"
              ? "Сайт подключён через Custom Webhook. Можно отправить статью прямо в блог сайта."
              : "Подключите WordPress или Custom Webhook, чтобы публиковать без ручного копирования."}
        </p>
      </div>

      {customConnected ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15">
              <Webhook className="size-4 text-emerald-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-50">
                Сайт подключён: {customHost ?? "Custom Webhook"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                RankBoost отправит статью в блог сайта. Для popart.ee это создаёт
                JSON-файл статьи в репозитории и запускает деплой сайта.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={publishing !== null}
              onClick={() => void handleCustomPublish(true)}
              className="border-emerald-300/30 bg-white/5 text-emerald-50 hover:bg-white/10"
            >
              {publishing === "test" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить связь
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={publishing !== null}
              onClick={() => void handleCustomPublish(false)}
              className="bg-emerald-500 text-white hover:bg-emerald-400"
            >
              {publishing === "send" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Опубликовать на сайте
            </Button>
          </div>
          {publishMessage ? (
            <p className="mt-3 text-xs text-emerald-100">{publishMessage}</p>
          ) : null}
          {publishError ? (
            <p className="mt-3 text-xs text-red-200">{publishError}</p>
          ) : null}
          {customHost ? (
            <a
              href={`https://${customHost}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-100 underline"
            >
              Открыть сайт
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Скопировать
        </p>
        <div className="grid gap-2">
          {copyRow("html", "Скопировать HTML", pkg.copy.articleHtml)}
          {copyRow("markdown", "Скопировать Markdown", pkg.copy.articleMarkdown)}
          {copyRow("metaTitle", "Скопировать SEO title", pkg.copy.metaTitle)}
          {copyRow(
            "metaDescription",
            "Скопировать meta description",
            pkg.copy.metaDescription
          )}
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

      {!customConnected ? <CustomPublishingSetup articleId={articleId} /> : null}
    </div>
  );
}
