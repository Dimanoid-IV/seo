import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import type { SaasLocale } from "@/lib/i18n/saas/locales";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { AnalyticsPageView } from "@/components/analytics/AnalyticsPageView";
import { SaasPricingSection } from "@/components/sections/SaasPricingSection";
import { MonthlyHowItWorksSection } from "@/components/sections/MonthlyHowItWorksSection";
import { CTASection } from "@/components/sections/CTASection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.pricing.title,
    description: dict.meta.pricing.description,
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

  return (
    <>
      <AnalyticsPageView
        event="pricing_view"
        locale={locale}
        route={`/${locale}/pricing`}
      />
      <div className="marketing-page min-h-screen">
        <div className="border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 to-white py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
              {dict.pricing.pageTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
              {dict.pricing.pageSubtitle}
            </p>
          </div>
        </div>
        <SaasPricingSection locale={saasLocale} hideHeading />
        <MonthlyHowItWorksSection dict={dict} />
        <CTASection locale={loc} dict={dict} source="pricing" theme="marketing" />
      </div>
    </>
  );
}
