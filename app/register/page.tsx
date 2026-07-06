import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Start free — RankBoost",
  description: "Create your RankBoost account and start improving your website.",
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{ website?: string; previewToken?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const initialWebsite = params.website?.trim() ?? "";
  const initialPreviewToken = params.previewToken?.trim() ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <AuthCard
          title="Start free with RankBoost"
          subtitle="Your AI Growth Manager for website growth"
        >
          <RegisterForm
            initialWebsite={initialWebsite}
            initialPreviewToken={initialPreviewToken}
          />
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
