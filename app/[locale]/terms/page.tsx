import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata } from "@/lib/seo";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.terms.title,
    description: dict.meta.terms.description,
    path: "/terms",
    locale,
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="marketing-page min-h-screen">
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900">{dict.terms.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{dict.terms.lastUpdated}</p>
          <div className="mt-12 space-y-10">
            {dict.terms.sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-4 text-xl font-semibold text-slate-900">
                  {section.title}
                </h2>
                <p className="leading-relaxed text-slate-600">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
