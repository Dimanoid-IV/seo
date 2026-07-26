"use client";

import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useSaasTranslations } from "@/lib/i18n/saas/SaasLocaleProvider";

export function LoginPageContent({ selectedPlan = "" }: { selectedPlan?: string }) {
  const { dict } = useSaasTranslations();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 [background-image:var(--aqua-wash),var(--lilac-bleed)]">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageSwitcher variant="auth" />
        </div>
        <AuthCard title={dict.auth.loginTitle} subtitle={dict.auth.loginSubtitle}>
          <LoginForm selectedPlan={selectedPlan} />
        </AuthCard>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-[#8169ff] hover:text-[#6d4ff0]">
            {dict.auth.backToHome}
          </Link>
        </p>
      </div>
    </main>
  );
}
