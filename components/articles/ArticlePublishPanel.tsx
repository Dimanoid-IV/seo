"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Feather,
  GitPullRequest,
  Globe2,
  Loader2,
  Mail,
  Send,
  ShoppingBag,
  WandSparkles,
  Webhook,
} from "lucide-react";

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
    githubPr?: {
      connected: boolean;
      repo: string | null;
      contentPath: string | null;
    };
    webflow?: {
      connected: boolean;
      collectionId: string | null;
    };
    shopify?: {
      connected: boolean;
      shopDomain: string | null;
      blogId: string | null;
    };
    wix?: {
      connected: boolean;
      siteId: string | null;
    };
    ghost?: {
      connected: boolean;
      adminUrl: string | null;
    };
    noCodeAutomation?: {
      zapierConnected: boolean;
      makeConnected: boolean;
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
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);
  const [githubPath, setGithubPath] = useState<string | null>(null);
  const [githubPublishing, setGithubPublishing] = useState<"dry" | "create" | null>(null);
  const [webflowConnected, setWebflowConnected] = useState(false);
  const [webflowCollectionId, setWebflowCollectionId] = useState<string | null>(null);
  const [webflowPublishing, setWebflowPublishing] = useState<"dry" | "create" | null>(null);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyShopDomain, setShopifyShopDomain] = useState<string | null>(null);
  const [shopifyPublishing, setShopifyPublishing] = useState<"dry" | "create" | null>(null);
  const [wixConnected, setWixConnected] = useState(false);
  const [wixSiteId, setWixSiteId] = useState<string | null>(null);
  const [wixPublishing, setWixPublishing] = useState<"dry" | "create" | null>(null);
  const [ghostConnected, setGhostConnected] = useState(false);
  const [ghostAdminUrl, setGhostAdminUrl] = useState<string | null>(null);
  const [ghostPublishing, setGhostPublishing] = useState<"dry" | "create" | null>(null);
  const [zapierConnected, setZapierConnected] = useState(false);
  const [makeConnected, setMakeConnected] = useState(false);
  const [noCodePublishing, setNoCodePublishing] = useState<
    "zapier-dry" | "zapier-send" | "make-dry" | "make-send" | null
  >(null);

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
          setGithubConnected(body.data.githubPr?.connected === true);
          setGithubRepo(body.data.githubPr?.repo ?? null);
          setGithubPath(body.data.githubPr?.contentPath ?? null);
          setWebflowConnected(body.data.webflow?.connected === true);
          setWebflowCollectionId(body.data.webflow?.collectionId ?? null);
          setShopifyConnected(body.data.shopify?.connected === true);
          setShopifyShopDomain(body.data.shopify?.shopDomain ?? null);
          setWixConnected(body.data.wix?.connected === true);
          setWixSiteId(body.data.wix?.siteId ?? null);
          setGhostConnected(body.data.ghost?.connected === true);
          setGhostAdminUrl(body.data.ghost?.adminUrl ?? null);
          setZapierConnected(
            body.data.noCodeAutomation?.zapierConnected === true
          );
          setMakeConnected(body.data.noCodeAutomation?.makeConnected === true);
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
            : `Статья отправлена на ${customHost ?? "сайт"}. Если сайт публикуется через деплой, она появится после деплоя.`
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

  async function handleGithubPr(dryRun: boolean) {
    setGithubPublishing(dryRun ? "dry" : "create");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/github-pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: {
          dryRun?: boolean;
          created?: boolean;
          pullRequestUrl?: string | null;
          filePath?: string;
        };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить GitHub PR."
              : "Не удалось создать GitHub pull request.")
        );
        return;
      }
      if (dryRun) {
        setPublishMessage(
          `GitHub PR готов к созданию: ${body.data?.filePath ?? githubPath ?? "content/blog"}.`
        );
        return;
      }
      setPublishMessage(
        body.data?.pullRequestUrl
          ? `Pull request создан: ${body.data.pullRequestUrl}`
          : "Pull request создан или уже существует."
      );
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке GitHub PR."
          : "Сетевая ошибка при создании GitHub PR."
      );
    } finally {
      setGithubPublishing(null);
    }
  }

  async function handleWebflow(dryRun: boolean) {
    setWebflowPublishing(dryRun ? "dry" : "create");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/webflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { itemId?: string | null; itemUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить Webflow item."
              : "Не удалось создать Webflow CMS item.")
        );
        return;
      }
      setPublishMessage(
        dryRun
          ? "Webflow item готов к созданию."
          : body.data?.itemUrl
            ? `Webflow CMS item создан: ${body.data.itemUrl}`
            : "Webflow CMS item создан."
      );
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке Webflow."
          : "Сетевая ошибка при создании Webflow item."
      );
    } finally {
      setWebflowPublishing(null);
    }
  }

  async function handleShopify(dryRun: boolean) {
    setShopifyPublishing(dryRun ? "dry" : "create");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/shopify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { articleUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить Shopify article."
              : "Не удалось создать Shopify blog article.")
        );
        return;
      }
      setPublishMessage(
        dryRun
          ? "Shopify article готов к созданию."
          : body.data?.articleUrl
            ? `Shopify blog article создан: ${body.data.articleUrl}`
            : "Shopify blog article создан."
      );
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке Shopify."
          : "Сетевая ошибка при создании Shopify article."
      );
    } finally {
      setShopifyPublishing(null);
    }
  }

  async function handleGhost(dryRun: boolean) {
    setGhostPublishing(dryRun ? "dry" : "create");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/ghost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { postUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить Ghost post."
              : "Не удалось создать Ghost post.")
        );
        return;
      }
      setPublishMessage(
        dryRun
          ? "Ghost post готов к созданию."
          : body.data?.postUrl
            ? `Ghost post создан: ${body.data.postUrl}`
            : "Ghost post создан."
      );
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке Ghost."
          : "Сетевая ошибка при создании Ghost post."
      );
    } finally {
      setGhostPublishing(null);
    }
  }

  async function handleWix(dryRun: boolean) {
    setWixPublishing(dryRun ? "dry" : "create");
    setPublishMessage(null);
    setPublishError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/wix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        data?: { draftPostUrl?: string | null };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? "Не удалось проверить Wix draft."
              : "Не удалось создать Wix draft post.")
        );
        return;
      }
      setPublishMessage(
        dryRun
          ? "Wix draft готов к созданию."
          : body.data?.draftPostUrl
            ? `Wix draft создан: ${body.data.draftPostUrl}`
            : "Wix draft создан."
      );
    } catch {
      setPublishError(
        dryRun
          ? "Сетевая ошибка при проверке Wix."
          : "Сетевая ошибка при создании Wix draft."
      );
    } finally {
      setWixPublishing(null);
    }
  }

  async function handleNoCodeAutomation(
    provider: "zapier" | "make",
    dryRun: boolean
  ) {
    setNoCodePublishing(`${provider}-${dryRun ? "dry" : "send"}`);
    setPublishMessage(null);
    setPublishError(null);
    const label = provider === "zapier" ? "Zapier" : "Make";
    try {
      const response = await authFetch(
        `/api/articles/${articleId}/no-code-automation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, dryRun }),
        }
      );
      const body = (await response.json().catch(() => ({}))) as {
        data?: { delivered?: boolean; statusCode?: number };
        error?: { message?: string };
      };
      if (!response.ok) {
        setPublishError(
          body.error?.message ??
            (dryRun
              ? `Не удалось проверить ${label}.`
              : `Не удалось отправить ${label} trigger.`)
        );
        return;
      }
      setPublishMessage(
        dryRun
          ? `${label} trigger готов к отправке.`
          : `${label} trigger отправлен${
              body.data?.statusCode ? ` (HTTP ${body.data.statusCode})` : ""
            }.`
      );
    } catch {
      setPublishError(
        dryRun
          ? `Сетевая ошибка при проверке ${label}.`
          : `Сетевая ошибка при отправке ${label} trigger.`
      );
    } finally {
      setNoCodePublishing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <Loader2 className="size-4 animate-spin" />
        Готовим материалы…
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
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
      className="justify-start border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {isWordPressLivePublished ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <p className="font-semibold text-emerald-900">Published on WordPress</p>
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
            <p className="mt-1 text-emerald-800">
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
          <p className="mt-2 text-amber-800">
            Moving back to draft changes the WordPress post status. The post is
            not deleted.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2 border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
            disabled={rollingBack}
            onClick={() => void handleRollback()}
          >
            {rollingBack ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Move back to draft
          </Button>
          {rollbackMessage ? (
            <p className="mt-2 text-emerald-800">{rollbackMessage}</p>
          ) : null}
        </div>
      ) : null}

      {isCustomPublished ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <p className="font-semibold text-emerald-900">
            {hostedPublished ? "Статья опубликована на RankBoost" : "Статья отправлена на сайт"}
          </p>
          <p className="mt-1 text-emerald-800">
            {hostedPublished
              ? "Это публичная hosted-страница. Для публикации на вашем домене подключите WordPress или свой сайт."
              : "RankBoost получил успешный ответ от подключённого сайта. Если сайт публикуется через деплой, статья появится после завершения деплоя."}
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
        <h3 className="text-sm font-semibold text-slate-900">Публикация статьи</h3>
        <p className="mt-1 text-xs text-slate-600">
          {publishPriority === "wordpress_draft"
            ? "WordPress подключён: RankBoost может создать черновик или публиковать через автопилот, если это разрешено в плане."
            : publishPriority === "webhook"
              ? "Custom-сайт подключён. Нажмите «Опубликовать на сайте», и RankBoost отправит готовую статью в ваш блог."
              : "Если WordPress или свой сайт ещё не подключены, можно опубликовать временную hosted-страницу RankBoost в один клик."}
        </p>
      </div>

      {!isWordPressLivePublished && !customConnected ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Webhook className="size-4 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900">
                Публиковать прямо на своём сайте
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                Для своего сайта нужен один защищённый адрес публикации. После проверки
                RankBoost сможет отправлять готовые статьи в ваш блог одной
                кнопкой, а позже — по подтверждённому месячному плану.
              </p>
            </div>
          </div>
          <Link
            href="/app/integrations#custom-publishing"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <Webhook className="size-4" />
            Подключить мой сайт
          </Link>
        </div>
      ) : null}

      {!isWordPressLivePublished && !customConnected ? (
        <div className="rounded-xl border border-[#c9bfff]/55 bg-[#c9bfff]/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#c9bfff]/35">
              <Globe2 className="size-4 text-[#6d4ff0]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#181818]">
                Самый простой способ: hosted-страница RankBoost
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#6d4ff0]">
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
                className="inline-flex items-center gap-2 rounded-md bg-[#6d4ff0] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#6d4ff0]"
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
                className="bg-[#6d4ff0] text-white hover:bg-[#6d4ff0]"
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
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Webhook className="size-4 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900">
                Сайт подключён: {customHost ?? "свой сайт"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                RankBoost отправит title, slug, HTML, Markdown, SEO title и meta
                description в подключённый сайт. Если сайт связан с
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
              className="bg-emerald-700 text-white hover:bg-emerald-800"
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
              className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
            >
              {publishing === "test" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить связь
            </Button>
          </div>
          {publishMessage ? (
            <p className="mt-3 text-xs text-emerald-800">{publishMessage}</p>
          ) : null}
          {publishError ? (
            <p className="mt-3 text-xs text-red-700">{publishError}</p>
          ) : null}
          {customHost ? (
            <a
              href={`https://${customHost}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-800 underline"
            >
              Открыть сайт
              <ExternalLink className="size-3" />
            </a>
          ) : null}
        </div>
      ) : null}

      {githubConnected ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <GitPullRequest className="size-4 text-slate-800" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                GitHub подключён: {githubRepo ?? "repository"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                RankBoost создаст Markdown-файл в {githubPath ?? "content/blog"} и
                откроет pull request. Сайт изменится только после merge/deploy.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={githubPublishing !== null}
              onClick={() => void handleGithubPr(false)}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {githubPublishing === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <GitPullRequest className="size-4" />
              )}
              Создать PR
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={githubPublishing !== null}
              onClick={() => void handleGithubPr(true)}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            >
              {githubPublishing === "dry" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить PR
            </Button>
          </div>
        </div>
      ) : null}

      {webflowConnected ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Globe2 className="size-4 text-blue-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-950">
                Webflow подключён
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800">
                RankBoost создаст CMS item в collection{" "}
                {webflowCollectionId ?? "Webflow"}. Перед live-публикацией
                проверьте item в Webflow.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={webflowPublishing !== null}
              onClick={() => void handleWebflow(false)}
              className="bg-blue-700 text-white hover:bg-blue-800"
            >
              {webflowPublishing === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Создать Webflow item
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={webflowPublishing !== null}
              onClick={() => void handleWebflow(true)}
              className="border-blue-200 bg-white text-blue-800 hover:bg-blue-100"
            >
              {webflowPublishing === "dry" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить Webflow
            </Button>
          </div>
        </div>
      ) : null}

      {shopifyConnected ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <ShoppingBag className="size-4 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-950">
                Shopify подключён
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                RankBoost создаст blog article в магазине{" "}
                {shopifyShopDomain ?? "Shopify"}. По умолчанию это безопасный
                draft-путь для проверки.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={shopifyPublishing !== null}
              onClick={() => void handleShopify(false)}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
            >
              {shopifyPublishing === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              Создать Shopify article
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={shopifyPublishing !== null}
              onClick={() => void handleShopify(true)}
              className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-100"
            >
              {shopifyPublishing === "dry" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить Shopify
            </Button>
          </div>
        </div>
      ) : null}

      {wixConnected ? (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <WandSparkles className="size-4 text-cyan-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cyan-950">
                Wix подключён
              </p>
              <p className="mt-1 text-xs leading-relaxed text-cyan-800">
                RankBoost создаст draft post в Wix Blog{" "}
                {wixSiteId ? `(${wixSiteId})` : ""}. Перед live-публикацией
                проверьте запись в Wix.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={wixPublishing !== null}
              onClick={() => void handleWix(false)}
              className="bg-cyan-700 text-white hover:bg-cyan-800"
            >
              {wixPublishing === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <WandSparkles className="size-4" />
              )}
              Создать Wix draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={wixPublishing !== null}
              onClick={() => void handleWix(true)}
              className="border-cyan-200 bg-white text-cyan-800 hover:bg-cyan-100"
            >
              {wixPublishing === "dry" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить Wix
            </Button>
          </div>
        </div>
      ) : null}

      {ghostConnected ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Feather className="size-4 text-indigo-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-950">
                Ghost подключён
              </p>
              <p className="mt-1 text-xs leading-relaxed text-indigo-800">
                RankBoost создаст post в Ghost{" "}
                {ghostAdminUrl ? `(${ghostAdminUrl})` : ""}. По умолчанию это
                draft-путь для проверки.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={ghostPublishing !== null}
              onClick={() => void handleGhost(false)}
              className="bg-indigo-700 text-white hover:bg-indigo-800"
            >
              {ghostPublishing === "create" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Feather className="size-4" />
              )}
              Создать Ghost post
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={ghostPublishing !== null}
              onClick={() => void handleGhost(true)}
              className="border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-100"
            >
              {ghostPublishing === "dry" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить Ghost
            </Button>
          </div>
        </div>
      ) : null}

      {zapierConnected || makeConnected ? (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white">
              <Webhook className="size-4 text-violet-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-violet-950">
                No-code автоматизация подключена
              </p>
              <p className="mt-1 text-xs leading-relaxed text-violet-800">
                RankBoost отправит готовую статью в Zapier или Make scenario.
                Дальше сценарий может создать запись в любой CMS.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {zapierConnected ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={noCodePublishing !== null}
                  onClick={() => void handleNoCodeAutomation("zapier", false)}
                  className="bg-violet-700 text-white hover:bg-violet-800"
                >
                  {noCodePublishing === "zapier-send" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Webhook className="size-4" />
                  )}
                  Отправить в Zapier
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={noCodePublishing !== null}
                  onClick={() => void handleNoCodeAutomation("zapier", true)}
                  className="border-violet-200 bg-white text-violet-800 hover:bg-violet-100"
                >
                  {noCodePublishing === "zapier-dry" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Проверить Zapier
                </Button>
              </>
            ) : null}
            {makeConnected ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  disabled={noCodePublishing !== null}
                  onClick={() => void handleNoCodeAutomation("make", false)}
                  className="bg-violet-700 text-white hover:bg-violet-800"
                >
                  {noCodePublishing === "make-send" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Webhook className="size-4" />
                  )}
                  Отправить в Make
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={noCodePublishing !== null}
                  onClick={() => void handleNoCodeAutomation("make", true)}
                  className="border-violet-200 bg-white text-violet-800 hover:bg-violet-100"
                >
                  {noCodePublishing === "make-dry" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  Проверить Make
                </Button>
              </>
            ) : null}
          </div>
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
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
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
        <div className="space-y-3 rounded-xl border border-[#c9bfff]/55 bg-[#c9bfff]/20 p-4">
          <div className="flex items-start gap-3">
            <Webhook className="mt-0.5 size-4 shrink-0 text-[#6d4ff0]" />
            <div>
              <p className="text-sm font-semibold text-[#181818]">
                Хотите публиковать на custom-сайт одной кнопкой?
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#6d4ff0]">
                Подключите один защищённый адрес публикации в интеграциях. После
                проверки здесь появится кнопка «Опубликовать на сайте».
              </p>
            </div>
          </div>
          <Link
            href="/app/integrations#custom-publishing"
            className="inline-flex items-center justify-center rounded-md bg-[#6d4ff0] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#6d4ff0]"
          >
            Настроить публикацию на сайт
          </Link>
        </div>
      ) : null}
    </div>
  );
}
