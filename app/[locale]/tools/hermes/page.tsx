import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HermesChat } from "@/components/hermes/HermesChat";
import { locales } from "@/i18n/config";
import { isValidLocale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  return generatePageMetadata({
    title: "Hermes SEO Assistant",
    description:
      "AI assistant for SEO analysis, content generation, keyword research and growth strategy.",
    path: "/tools/hermes",
    locale,
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HermesToolPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-2xl md:p-12">
        <h1 className="text-4xl font-bold text-slate-900">Hermes SEO Assistant</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-600">
          Интегрированный AI-ассистент для SEO-анализа, генерации контента и
          стратегических рекомендаций. Использует Hermes Agent через защищённый
          серверный endpoint RankBoost.eu.
        </p>

        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-blue-700">📊 Анализ SEO</h3>
            <p className="mt-2 text-sm text-slate-600">
              Аудит сайтов, выявление проблем и рекомендации по улучшению.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-blue-700">📝 Генерация контента</h3>
            <p className="mt-2 text-sm text-slate-600">
              SEO-статьи, заголовки, мета-описания и контент-планы.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-blue-700">🔍 Keywords</h3>
            <p className="mt-2 text-sm text-slate-600">
              Подбор ключевых слов и тем для органического роста.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="font-semibold text-blue-700">🚀 Стратегия</h3>
            <p className="mt-2 text-sm text-slate-600">
              Практические рекомендации по продвижению бизнеса.
            </p>
          </div>
        </section>

        <HermesChat />

        <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-bold text-blue-800">Как работает интеграция</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 text-slate-700">
            <li>Форма отправляет вопрос на <code>/api/hermes</code>.</li>
            <li>Vercel Function берёт ключи из Environment Variables.</li>
            <li>Запрос уходит на URL из <code>HERMES_API_URL</code>.</li>
            <li>Ответ Hermes возвращается в интерфейс RankBoost.eu.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
