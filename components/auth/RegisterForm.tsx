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
import {
  billingPathForPlanQuery,
  normalizeBillingPlanQuery,
  planQuerySuffix,
} from "@/lib/billing/plan-query";

export function RegisterForm({
  initialWebsite = "",
  initialPreviewToken = "",
  selectedPlan = "",
}: {
  initialWebsite?: string;
  initialPreviewToken?: string;
  selectedPlan?: string;
}) {
  const router = useRouter();
  const { dict, locale } = useSaasTranslations();
  const { auth } = dict;
  const normalizedPlan = normalizeBillingPlanQuery(selectedPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const previewToken = initialPreviewToken.trim() || undefined;
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const termsHref = `/${locale === "en" ? "en" : locale}/terms`;
  const privacyHref = `/${locale === "en" ? "en" : locale}/privacy`;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);

    if (!acceptTerms) {
      setFieldErrors([auth.termsRequired]);
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
          previewToken,
          acceptTerms: true,
          locale,
        }),
      });

      if (!response.ok) {
        const message = await parseApiErrorMessage(response, auth.registerFailed);
        setError(message);
        return;
      }

      const data = (await response.json()) as { accessToken?: string };
      if (!data.accessToken) {
        setError(auth.noAccessToken);
        return;
      }

      storeAccessToken(data.accessToken);
      router.push(normalizedPlan ? billingPathForPlanQuery(normalizedPlan) : "/app");
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

      {fieldErrors.length > 0 ? (
        <ul className="space-y-1 text-sm text-red-600">
          {fieldErrors.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="register-name">{auth.name}</Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={loading}
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">{auth.email}</Label>
        <Input
          id="register-email"
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
        <Label htmlFor="register-password">{auth.password}</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={auth.passwordMinHint}
          disabled={loading}
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-website">
          {auth.websiteOptional}{" "}
          <span className="text-slate-500">{auth.websiteOptionalHint}</span>
        </Label>
        <Input
          id="register-website"
          type="url"
          autoComplete="url"
          value={websiteUrl}
          onChange={(event) => setWebsiteUrl(event.target.value)}
          placeholder="https://example.com"
          disabled={loading}
          className="border-slate-200 bg-white text-slate-900"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(event) => setAcceptTerms(event.target.checked)}
          disabled={loading}
          className="mt-1 size-4 rounded border-slate-300 accent-blue-600"
        />
        <span>
          {auth.acceptTerms}{" "}
          <Link href={termsHref} className="text-blue-600 hover:text-blue-700">
            {auth.termsLink}
          </Link>{" "}
          {locale === "ru" ? "и" : locale === "et" ? "ja" : "and"}{" "}
          <Link href={privacyHref} className="text-blue-600 hover:text-blue-700">
            {auth.privacyLink}
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
            {auth.registering}
          </>
        ) : (
          auth.register
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
        {auth.hasAccount}{" "}
        <Link
          href={`/login${planQuerySuffix(normalizedPlan)}`}
          className="text-blue-600 hover:text-blue-700"
        >
          {auth.login}
        </Link>
      </p>
    </form>
  );
}
