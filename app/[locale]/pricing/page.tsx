import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { getSaasDictionary } from "@/lib/i18n/saas";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { SaasPricingSection } from "@/components/sections/SaasPricingSection";
import { CTASection } from "@/components/sections/CTASection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const pricing = getSaasDictionary(locale as SaasLocale).pricing;
  return generatePageMetadata({
    title: `${pricing.pageTitle} | RankBoost`,
    description: pricing.pageSubtitle,
    path: "/pricing",
    locale,
    keywords: SEO_KEYWORDS[locale as Locale],
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PricingPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const loc = locale as Locale;
  const saasLocale = locale as SaasLocale;
  const pricing = getSaasDictionary(saasLocale).pricing;

  return (
    <>
      <div className="marketing-page border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            {pricing.pageTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {pricing.pageSubtitle}
          </p>
        </div>
      </div>
      <div className="marketing-page">
        <SaasPricingSection locale={saasLocale} />
      </div>
      <CTASection locale={loc} dict={dict} source="pricing" theme="marketing" />
    </>
  );
}
