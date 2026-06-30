"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseApiErrorMessage,
  storeAccessToken,
} from "@/lib/auth/client-session";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);

    if (!acceptTerms) {
      setFieldErrors(["Необходимо принять условия использования"]);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          password,
          websiteUrl: websiteUrl.trim() || undefined,
          acceptTerms: true,
          locale: "ru",
        }),
      });

      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          "Не удалось зарегистрироваться"
        );
        setError(message);
        return;
      }

      const data = (await response.json()) as { accessToken?: string };
      if (!data.accessToken) {
        setError("Сервер не вернул access token");
        return;
      }

      storeAccessToken(data.accessToken);
      router.push("/app");
      router.refresh();
    } catch {
      setError("Сетевая ошибка. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <AuthError message={error} /> : null}

      {fieldErrors.length > 0 ? (
        <ul className="space-y-1 text-sm text-red-300">
          {fieldErrors.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="register-name">Имя</Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Анна"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Пароль</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Минимум 8 символов"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-website">
          URL сайта <span className="text-slate-500">(необязательно)</span>
        </Label>
        <Input
          id="register-website"
          type="url"
          autoComplete="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://example.com"
          disabled={loading}
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          disabled={loading}
          className="mt-1 size-4 rounded border-white/20 bg-white/5 accent-blue-500"
        />
        <span>
          Я принимаю{" "}
          <Link href="/ru/terms" className="text-blue-400 hover:text-cyan-400">
            условия использования
          </Link>{" "}
          и{" "}
          <Link href="/ru/privacy" className="text-blue-400 hover:text-cyan-400">
            политику конфиденциальности
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:from-blue-600 hover:to-violet-700"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Создаём аккаунт…
          </>
        ) : (
          "Создать аккаунт"
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full border-white/10 bg-white/5 text-slate-400"
        disabled
        aria-disabled
      >
        Продолжить с Google — скоро
      </Button>

      <p className="text-center text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-blue-400 hover:text-cyan-400">
          Войти
        </Link>
      </p>
    </form>
  );
}
