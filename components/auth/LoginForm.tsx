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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const message = await parseApiErrorMessage(
          response,
          "Не удалось войти. Проверьте email и пароль."
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

      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
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
        <Label htmlFor="login-password">Пароль</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:from-blue-600 hover:to-violet-700"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Входим…
          </>
        ) : (
          "Войти"
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
        Нет аккаунта?{" "}
        <Link href="/register" className="text-blue-400 hover:text-cyan-400">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
