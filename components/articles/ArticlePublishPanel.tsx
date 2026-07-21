"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Globe2, Loader2, Mail, Send, Webhook } from "lucide-react";

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
    hostedBlog?: {
      url: string;
      published: boolean;
    };
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
  const [hostedPublishing, setHostedPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [hostedPublished, setHostedPublished] = useState(false);

  const isWordPressLivePublished =
    articleStatus === "PUBLISHED" && Boolean(wordpressPostId);
  const isCustomPublished =
    articleStatus === "PUBLISHED" && !wordpressPostId;

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
          setHostedUrl(body.data.hostedBlog?.url ?? null);
          setHostedPublished(body.data.hostedBlog?.published === true);
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
            : `Статья отправлена на ${customHost ?? "сайт"}. Если endpoint запускает деплой, она появится после деплоя.`
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

  async function handleHostedPublish() {
    setHostedPublishing(true);
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/hosted-publish`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { hostedUrl?: string; alreadyPublished?: boolean };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            "Не удалось опубликовать статью на hosted-странице."
        );
        return;
      }
      const url = body.data?.hostedUrl ?? hostedUrl;
      if (url) {
        setHostedUrl(url);
      }
      setHostedPublished(true);
      setPublishMessage(
        body.data?.alreadyPublished
          ? "Статья уже опубликована на hosted-странице RankBoost."
          : "Статья опубликована на hosted-странице RankBoost. Этот URL можно открыть или передать разработчику."
      );
    } catch {
      setPublishError("Сетевая ошибка при публикации hosted-страницы.");
    } finally {
      setHostedPublishing(false);
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
      {isWordPressLivePublished ? (
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

      {isCustomPublished ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-50">
          <p className="font-semibold text-emerald-100">
            {hostedPublished ? "Статья опубликована на RankBoost" : "Статья отправлена на сайт"}
          </p>
          <p className="mt-1 text-emerald-100/80">
            {hostedPublished
              ? "Это публичная hosted-страница. Для публикации на вашем домене подключите WordPress или custom endpoint."
              : "RankBoost получил успешный ответ от custom endpoint. Если сайт публикуется через деплой, статья появится после завершения деплоя."}
          </p>
          {hostedPublished && hostedUrl ? (
            <a
              href={hostedUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 underline"
            >
              Открыть hosted-страницу
              <ExternalLink className="size-3" />
            </a>
          ) : customHost ? (
            <a
              href={`https://${customHost}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 underline"
            >
              Открыть сайт
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      ) : null}

      <div>
        <h3 className="text-sm font-semibold text-white">Публикация статьи</h3>
        <p className="mt-1 text-xs text-slate-400">
          {publishPriority === "wordpress_draft"
            ? "WordPress подключён: RankBoost может создать черновик или публиковать через автопилот, если это разрешено в плане."
            : publishPriority === "webhook"
              ? "Custom-сайт подключён. Нажмите «Опубликовать на сайте», и RankBoost отправит готовую статью в ваш блог."
              : "Если WordPress или endpoint ещё не подключены, можно опубликовать временную hosted-страницу RankBoost в один клик."}
        </p>
      </div>

      {!isWordPressLivePublished && !customConnected ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15">
              <Webhook className="size-4 text-emerald-100" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-50">
                Публиковать прямо на своём сайте
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
                Для custom-сайта нужен один защищённый endpoint. После проверки
                RankBoost сможет отправлять готовые статьи в ваш блог одной
                кнопкой, а позже — по подтверждённому месячному плану.
              </p>
            </div>
          </div>
          <Link
            href="/app/integrations#custom-publishing"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            <Webhook className="size-4" />
            Подключить мой сайт
          </Link>
        </div>
      ) : null}

      {!isWordPressLivePublished && !customConnected ? (
        <div className="rounded-xl border border-blue-400/25 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/15">
              <Globe2 className="size-4 text-blue-100" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-50">
                Самый простой способ: hosted-страница RankBoost
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-100/80">
                RankBoost создаст публичную страницу статьи. Это не заменяет
                публикацию на вашем домене, но позволяет сразу проверить и
                использовать материал без разработчика.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {hostedPublished && hostedUrl ? (
              <a
                href={hostedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                <ExternalLink className="size-4" />
                Открыть страницу
              </a>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={hostedPublishing}
                onClick={() => void handleHostedPublish()}
                className="bg-blue-500 text-white hover:bg-blue-400"
              >
                {hostedPublishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Globe2 className="size-4" />
                )}
                Опубликовать hosted-страницу
              </Button>
            )}
          </div>
        </div>
      ) : null}

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
                RankBoost отправит title, slug, HTML, Markdown, SEO title и meta
                description в подключённый endpoint. Если endpoint связан с
                репозиторием/деплоем, статья появится на сайте автоматически.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
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

      {!customConnected ? (
        <div className="space-y-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 size-4 shrink-0 text-cyan-200" />
            <div>
              <p className="text-sm font-semibold text-cyan-50">
                Хотите публиковать на custom-сайт одной кнопкой?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-cyan-100/80">
                Подключите один защищённый endpoint в интеграциях. После
                проверки здесь появится кнопка «Опубликовать на сайте».
              </p>
            </div>
          </div>
          <Link
            href="/app/integrations"
            className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-cyan-400"
          >
            Настроить публикацию на сайт
          </Link>
          <CustomPublishingSetup articleId={articleId} />
        </div>
      ) : null}
    </div>
  );
}
