"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Code2, Loader2, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";
import { cn } from "@/lib/utils";

type CustomPublishingConfig = {
  endpointConfigured: boolean;
  endpointHost: string | null;
  testedAt: string | null;
  hasSharedSecret: boolean;
};

type CustomWebsiteIntegrationPanelProps = {
  websiteId?: string | null;
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
 */
export function CustomWebsiteIntegrationPanel({
  websiteId,
  className,
}: CustomWebsiteIntegrationPanelProps) {
  const [endpointUrl, setEndpointUrl] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [busy, setBusy] = useState<"test" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [config, setConfig] = useState<CustomPublishingConfig | null>(null);

  useEffect(() => {
    // Config host is available via overview in future; keep local after test.
  }, []);

  const tested = Boolean(config?.testedAt);

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
        setConfig(body.data.config);
        setStatus(
          "Соединение успешно. Конфиг сохранён. Реальная отправка статьи — только вручную."
        );
        setSharedSecret("");
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
      setConfig(null);
      setEndpointUrl("");
      setStatus("Webhook отключён.");
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
            Для сайта без CMS
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Webhook для разработчика или готовый пакет HTML/Markdown. Custom
            сайт поддерживается — без тупика.
          </p>
        </div>
      </div>

      <ul className="space-y-1 text-sm text-slate-700">
        <li>• Webhook для разработчика</li>
        <li>• Готовый пакет HTML/Markdown</li>
        <li>• Проверить соединение перед отправкой</li>
      </ul>

      {tested ? (
        <div className="flex items-start gap-2 text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm">
            Webhook готов
            {config?.endpointHost ? ` (${config.endpointHost})` : ""}. Автоотправка
            выключена.
          </p>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-700">Endpoint URL</span>
        <input
          type="url"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
          placeholder="https://ваш-сайт.ru/api/rankboost"
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
          placeholder="секретидляподписи"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
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
          Проверить соединение
        </Button>
        {tested ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => void handleDisconnect()}
          >
            Отключить
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}

      <details className="rounded-lg border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-800">
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="size-3.5" />
            Для разработчика
          </span>
        </summary>
        <div className="mt-3 space-y-3 text-xs text-slate-600">
          <p>
            Тест шлёт <code>event: &quot;rankboost.test&quot;</code>. Реальная
            отправка — <code>article.ready</code> только после явного действия
            пользователя. Ожидайте HTTP 2xx. URL не логируется.
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
