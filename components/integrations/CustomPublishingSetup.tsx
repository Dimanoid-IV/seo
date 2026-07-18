"use client";

import { useState } from "react";
import { Loader2, Send, Webhook } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch, parseApiErrorMessage } from "@/lib/auth/client-session";

type WebhookResponse = {
  data: {
    dryRun: boolean;
    delivered: boolean;
    statusCode: number;
    error: string | null;
  };
};

type CustomPublishingSetupProps = {
  articleId: string;
};

/**
 * Optional webhook publisher for custom sites: the user provides an endpoint,
 * tests the connection with a dry-run ping, then delivers the approved article.
 */
export function CustomPublishingSetup({ articleId }: CustomPublishingSetupProps) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callWebhook(dryRun: boolean) {
    if (!url.trim()) {
      setError("Укажите URL эндпоинта.");
      return;
    }
    setBusy(dryRun ? "test" : "send");
    setStatus(null);
    setError(null);
    try {
      const response = await authFetch(`/api/articles/${articleId}/publish/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), dryRun }),
      });
      if (!response.ok) {
        setError(await parseApiErrorMessage(response, "Не удалось отправить запрос."));
        return;
      }
      const body = (await response.json()) as WebhookResponse;
      if (body.data.delivered) {
        setStatus(
          dryRun
            ? "Соединение успешно: эндпоинт ответил."
            : "Статья отправлена на ваш эндпоинт."
        );
      } else {
        setError(body.data.error ?? "Эндпоинт недоступен.");
      }
    } catch {
      setError("Сетевая ошибка при обращении к эндпоинту.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Webhook className="size-4 text-cyan-300" />
        Webhook для своего сайта
      </div>
      <p className="text-xs text-slate-400">
        Укажите endpoint вашего сайта — RankBoost отправит на него готовую статью.
        Сначала проверьте соединение.
      </p>
      <input
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://ваш-сайт.ru/api/rankboost"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-blue-500/50"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void callWebhook(true)}
          className="border-slate-300 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          {busy === "test" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Проверяем…
            </>
          ) : (
            "Проверить соединение"
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy !== null}
          onClick={() => void callWebhook(false)}
          className="bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
        >
          {busy === "send" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Отправляем…
            </>
          ) : (
            <>
              <Send className="size-4" />
              Отправить статью
            </>
          )}
        </Button>
      </div>
      {status ? <p className="text-xs text-emerald-300">{status}</p> : null}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
