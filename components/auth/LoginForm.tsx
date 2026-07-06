"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";
import {
  parseApiErrorMessage,
  storeAccessToken,
} from "@/lib/auth/client-session";

export function LoginForm() {
  const router = useRouter();
  const { dict } = useSaasTranslations();
  const { auth } = dict;
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
        const message = await parseApiErrorMessage(response, auth.loginFailed);
        setError(message);
        return;
      }

      const data = (await response.json()) as { accessToken?: string };
      if (!data.accessToken) {
        setError(auth.noAccessToken);
        return;
      }

      storeAccessToken(data.accessToken);
      router.push("/app");
      router.refresh();
    } catch {
      setError(auth.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <AuthError message={error} /> : null}

      <div className="space-y-2">
        <Label htmlFor="login-email">{auth.email}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          disabled={loading}
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">{auth.password}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          disabled={loading}
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {auth.loggingIn}
          </>
        ) : (
          auth.login
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-slate-200 bg-slate-50 text-slate-500"
        disabled
        aria-disabled
      >
        {auth.googleSoon}
      </Button>

      <p className="text-center text-sm text-slate-500">
        {auth.noAccount}{" "}
        <Link href="/register" className="text-blue-600 hover:text-blue-700">
          {auth.register}
        </Link>
      </p>
    </form>
  );
}
