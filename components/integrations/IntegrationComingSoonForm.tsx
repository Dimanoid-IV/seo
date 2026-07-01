"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IntegrationComingSoonFormProps = {
  providerTitle: string;
  defaultEmail?: string | null;
  className?: string;
};

export function IntegrationComingSoonForm({
  providerTitle,
  defaultEmail = "",
  className,
}: IntegrationComingSoonFormProps) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) {
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-emerald-200">Запрос сохранён локально</p>
            <p className="mt-1 text-sm text-slate-400">
              Мы сообщим на {email.trim()}, когда {providerTitle} будет готов.
              Отправка на сервер появится в следующем релизе.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <p className="text-sm text-slate-400">
        Интеграция в разработке. Оставьте email — сообщим, когда подключение
        станет доступно.
      </p>
      <div className="space-y-2">
        <label htmlFor="integration-notify-email" className="text-xs text-slate-500">
          Email для уведомления
        </label>
        <Input
          id="integration-notify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          className="border-white/10 bg-white/5 text-white"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting || !email.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Сохраняем…
          </>
        ) : (
          "Сообщить, когда будет готово"
        )}
      </Button>
    </form>
  );
}
