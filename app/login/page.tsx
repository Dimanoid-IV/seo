import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — RankBoost",
  description: "Log in to your RankBoost AI Growth Manager workspace.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <AuthCard
          title="Log in to RankBoost"
          subtitle="Your AI Growth Manager workspace"
        >
          <LoginForm />
        </AuthCard>
        <p className="text-center text-sm text-slate-500">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}
