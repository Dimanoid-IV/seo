import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { AuditUrlForm } from "@/components/audit/AuditUrlForm";

export const metadata: Metadata = {
  title: "Бесплатный аудит сайта — RankBoost",
  description:
    "Проверьте, почему сайт не приносит клиентов из Google и AI-поиска. Получите Growth Score и главные рекомендации.",
  openGraph: {
    title: "Бесплатный аудит сайта — RankBoost",
    description:
      "Проверьте, почему сайт не приносит клиентов из Google и AI-поиска. Получите Growth Score и главные рекомендации.",
  },
};

type AuditPageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const initialUrl = params.url?.trim() ?? "";

  return (
    <main className="hero-grid min-h-screen bg-[#050816]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-600/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link href="/ru" className="flex items-center gap-2 font-bold text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg">
              Rank<span className="gradient-text">Boost</span>.eu
            </span>
          </Link>
          <Link
            href="/register"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            Войти / Регистрация
          </Link>
        </header>

        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Бесплатный аудит сайта
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">
            Узнайте, что мешает получать клиентов из Google и AI-поиска. Growth Score
            preview и главные рекомендации — за минуту, без регистрации.
          </p>
        </div>

        <div className="mt-10">
          <AuditUrlForm initialUrl={initialUrl} />
        </div>
      </div>
    </main>
  );
}
