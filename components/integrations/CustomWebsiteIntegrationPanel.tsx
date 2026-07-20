"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Code2, Loader2, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import {
  buildCustomPublishingDisplayState,
  type CustomPublishingDisplayState,
} from "@/lib/publishing/custom-publishing-display";
import { cn } from "@/lib/utils";

type CustomPublishingConfig = {
  endpointConfigured: boolean;
  endpointHost: string | null;
  testedAt: string | null;
  hasSharedSecret: boolean;
};

type CustomWebsiteIntegrationPanelProps = {
  websiteId?: string | null;
  /** Host-only preload from integrations overview — never a full URL. */
  initialConfig?: CustomPublishingConfig | null;
  className?: string;
};

const PAYLOAD_EXAMPLE = `{
  "event": "article.ready",
  "article": {
    "id": "...",
    "title": "...",
    "slug": "...",
    "metaTitle": "...",
    "metaDescription": "...",
    "canonicalUrl": "...",
    "html": "...",
    "markdown": "...",
    "language": "ru",
    "targetKeyword": "...",
    "qualityScore": 100
  },
  "website": { "id": "...", "url": "..." }
}`;

const HMAC_EXAMPLE = `const crypto = require("crypto");
function verify(body, secret, header) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return header === expected;
}`;

/**
 * Site-level custom website / developer webhook integration.
 * When connected, shows host-only “Подключено: example.com” — never full URL/secret.
 */
export function CustomWebsiteIntegrationPanel({
  websiteId,
  initialConfig = null,
  className,
}: CustomWebsiteIntegrationPanelProps) {
  const [endpointUrl, setEndpointUrl] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [busy, setBusy] = useState<"test" | "disconnect" | "load" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loadedConfig, setLoadedConfig] = useState<CustomPublishingConfig | null>(
    null
  );
  const [sessionConfig, setSessionConfig] =
    useState<CustomPublishingConfig | null | undefined>(undefined);
  const [replacing, setReplacing] = useState(false);

  const config =
    sessionConfig !== undefined
      ? sessionConfig
      : loadedConfig ?? initialConfig ?? null;

  useEffect(() => {
    if (!websiteId || initialConfig) return;

    let cancelled = false;
    async function loadStatus() {
      setBusy("load");
      try {
        const response = await authFetch(
          `/api/integrations/custom-publishing?websiteId=${encodeURIComponent(websiteId!)}`
        );
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as {
          data: { config: CustomPublishingConfig | null };
        };
        if (!cancelled) setLoadedConfig(body.data.config);
      } catch {
        // ignore preload failures
      } finally {
        if (!cancelled) setBusy((b) => (b === "load" ? null : b));
      }
    }
    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [websiteId, initialConfig]);

  const display: CustomPublishingDisplayState =
    buildCustomPublishingDisplayState({
      endpointConfigured: config?.endpointConfigured,
      endpointHost: config?.endpointHost,
      testedAt: config?.testedAt,
      hasSharedSecret: config?.hasSharedSecret,
    });

  const showConnectedState = display.connected && !replacing;

  async function handleTest() {
    if (!websiteId) {
      setError("Добавьте сайт, чтобы настроить webhook.");
      return;
    }
    if (!endpointUrl.trim()) {
      setError("Укажите URL эндпоинта.");
      return;
    }
    setBusy("test");
    setError(null);
    setStatus(null);
    try {
      const response = await authFetch(
        "/api/integrations/custom-publishing/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            websiteId,
            endpointUrl: endpointUrl.trim(),
            sharedSecret: sharedSecret.trim() || undefined,
          }),
        }
      );
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Тест не удался."));
        return;
      }
      const body = (await response.json()) as {
        data: {
          delivered: boolean;
          error: string | null;
          config: CustomPublishingConfig | null;
        };
      };
      if (body.data.delivered) {
        setSessionConfig(body.data.config);
        setStatus(
          "Соединение успешно. Конфиг сохранён. Реальная отправка статьи — только вручную. Live publish выключен."
        );
        setSharedSecret("");
        setEndpointUrl("");
        setReplacing(false);
      } else {
        setError(body.data.error ?? "Эндпоинт недоступен.");
      }
    } catch {
      setError("Сетевая ошибка при проверке webhook.");
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
        "/api/integrations/custom-publishing/save",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteId }),
        }
      );
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Не удалось отключить."));
        return;
      }
      setSessionConfig(null);
      setLoadedConfig(null);
      setEndpointUrl("");
      setSharedSecret("");
      setReplacing(false);
      setStatus("Webhook отключён. Секрет и URL удалены.");
    } catch {
      setError("Сетевая ошибка при отключении.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-violet-200 bg-violet-50/40 p-4",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Webhook className="mt-0.5 size-4 shrink-0 text-violet-700" />
        <div>
          <p className="text-sm font-medium text-slate-900">
            Подключить публикацию на custom-сайт
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Если сайт не на WordPress, добавьте один защищённый endpoint. После
            этого в каждой готовой статье появится кнопка «Опубликовать на
            сайте».
          </p>
        </div>
      </div>

      <ul className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
        <li className="rounded-lg border border-violet-100 bg-white/70 p-3">
          <span className="font-medium text-slate-900">1. Endpoint на сайте</span>
          <span className="mt-1 block text-xs text-slate-600">
            Например /api/rankboost/articles.
          </span>
        </li>
        <li className="rounded-lg border border-violet-100 bg-white/70 p-3">
          <span className="font-medium text-slate-900">2. Проверка связи</span>
          <span className="mt-1 block text-xs text-slate-600">
            RankBoost отправляет тест без статьи.
          </span>
        </li>
        <li className="rounded-lg border border-violet-100 bg-white/70 p-3">
          <span className="font-medium text-slate-900">3. Публикация</span>
          <span className="mt-1 block text-xs text-slate-600">
            Готовая статья отправляется одной кнопкой.
          </span>
        </li>
      </ul>

      {showConnectedState ? (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
          <div className="flex items-start gap-2 text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {display.connectedBanner ?? "Публикация на сайт подключена"}
              </p>
              <p className="mt-1 text-xs text-emerald-700/90">
                В готовой статье будет кнопка «Опубликовать на сайте». Полный
                URL и secret не отображаются.
              </p>
              {display.hasSharedSecret ? (
                <p className="mt-1 text-xs text-slate-600">
                  HMAC secret сохранён (не показывается).
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => {
                setReplacing(true);
                setEndpointUrl("");
                setSharedSecret("");
                setStatus(null);
                setError(null);
              }}
            >
              Заменить endpoint
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handleDisconnect()}
            >
              {busy === "disconnect" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Отключить
            </Button>
          </div>
        </div>
      ) : (
        <>
          {replacing && display.hostLabel ? (
            <p className="text-xs text-slate-600">
              Сейчас подключено: {display.hostLabel}. Введите новый URL для
              повторной проверки.
            </p>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">
              URL для публикации
            </span>
            <input
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://ваш-сайт.ru/api/rankboost/articles"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium text-slate-700">
              Shared secret (опционально, HMAC)
            </span>
            <input
              type="password"
              value={sharedSecret}
              onChange={(e) => setSharedSecret(e.target.value)}
              placeholder={
                display.hasSharedSecret && replacing
                  ? "Оставьте пустым, чтобы сохранить прежний secret"
                  : "секретидляподписи"
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
            />
            <span className="text-[11px] text-slate-500">
              Secret никогда не показывается после сохранения.
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={busy !== null || !websiteId}
              onClick={() => void handleTest()}
            >
              {busy === "test" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Проверить и сохранить
            </Button>
            {replacing ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={() => {
                  setReplacing(false);
                  setEndpointUrl("");
                  setSharedSecret("");
                }}
              >
                Отмена
              </Button>
            ) : null}
          </div>
        </>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}

      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="size-3.5" />
            Технические детали для разработчика
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs text-slate-600">
          <p>
            Endpoint должен принимать POST JSON и отвечать HTTP 2xx. Тест шлёт{" "}
            <code>event: &quot;rankboost.test&quot;</code>. Реальная отправка —{" "}
            <code>article.ready</code> только после явного действия пользователя
            или после включения Auto-publish в подтверждённом месячном плане.
            URL и secret не логируются.
          </p>
          <p className="font-medium text-slate-800">Payload пример</p>
          <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-[11px] text-slate-100">
            {PAYLOAD_EXAMPLE}
          </pre>
          <p className="font-medium text-slate-800">
            HMAC заголовок <code>X-RankBoost-Signature</code>
          </p>
          <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-[11px] text-slate-100">
            {HMAC_EXAMPLE}
          </pre>
          <p>
            Если webhook не настроен — используйте универсальный пакет
            (HTML/Markdown/email разработчику) в карточке статьи.
          </p>
        </div>
      </details>
    </section>
  );
}
