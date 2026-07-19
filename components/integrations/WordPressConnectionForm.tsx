"use client";

import { useState } from "react";
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
  const { dict } = useSaasTranslations();
  const wp = dict.integrations.wordpress;

  const [siteUrl, setSiteUrl] = useState(
    integration.wordpress?.siteUrl || defaultSiteUrl || ""
  );
  const [username, setUsername] = useState("");
  const [applicationPassword, setApplicationPassword] = useState("");
  const [busy, setBusy] = useState<"test" | "save" | "disconnect" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [httpsWarning, setHttpsWarning] = useState(false);
  const [testPassed, setTestPassed] = useState(false);

  const isConnected =
    integration.connected ||
    integration.wordpress?.connectionStatus === "CONNECTED";

  async function callConnect(save: boolean) {
    if (!websiteId) {
      setError(wp.addWebsiteForKey);
      return;
    }
    if (!siteUrl.trim() || !username.trim() || !applicationPassword.trim()) {
      setError("Заполните URL, имя пользователя и Application Password.");
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
            save ? "Не удалось сохранить подключение." : "Проверка не удалась."
          )
        );
        return;
      }

      const body = (await response.json()) as ConnectResponse;
      setHttpsWarning(body.data.httpsWarning);
      setTestPassed(true);
      setStatus(
        save
          ? "Подключение сохранено. RankBoost будет создавать только черновики."
          : `Соединение успешно (${body.data.userLogin}). Можно сохранить.`
      );
      if (save) {
        setApplicationPassword("");
        onConnectionUpdated?.();
      }
    } catch {
      setTestPassed(false);
      setError("Сетевая ошибка при обращении к WordPress.");
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
        setError(await parseApiErrorMessage(response, "Не удалось отключить."));
        return;
      }
      setStatus("WordPress отключён.");
      setTestPassed(false);
      onConnectionUpdated?.();
    } catch {
      setError("Сетевая ошибка при отключении.");
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
          <li>• Создавать черновики WordPress</li>
          <li>• Публикация вручную после проверки</li>
        </ul>

        <p className="text-xs text-slate-600">{wp.draftOnlyMessage}</p>
        <p className="text-xs text-slate-500">
          Application Password больше не отображается после сохранения.
        </p>

        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() => void handleDisconnect()}
        >
          {busy === "disconnect" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Отключить
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
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-sky-700" />
        <div>
          <p className="text-sm font-medium text-slate-900">
            Подключение WordPress
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Создайте Application Password в WordPress. RankBoost будет создавать
            только черновики статей. Ничего не публикуется автоматически.
          </p>
        </div>
      </div>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
        <li>WordPress admin → Users → Profile</li>
        <li>Application Passwords</li>
        <li>Create new password «RankBoost»</li>
        <li>Скопируйте пароль в RankBoost</li>
        <li>Нажмите «Проверить подключение»</li>
      </ol>

      <div className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">
            URL сайта WordPress
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
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-700">
            Имя пользователя
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
            Application Password
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
            Не используйте обычный пароль администратора WordPress.
          </span>
        </label>
      </div>

      {httpsWarning ? (
        <div className="flex items-start gap-2 text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs">
            Сайт без HTTPS. Рекомендуем включить HTTPS перед продакшен-использованием.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null || !websiteId}
          onClick={() => void callConnect(false)}
        >
          {busy === "test" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Проверить подключение
        </Button>
        <Button
          type="button"
          disabled={busy !== null || !websiteId || !testPassed}
          onClick={() => void callConnect(true)}
        >
          {busy === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Сохранить подключение
        </Button>
      </div>

      {!websiteId ? (
        <p className="text-xs text-amber-700">{wp.addWebsiteForKey}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
    </section>
  );
}
