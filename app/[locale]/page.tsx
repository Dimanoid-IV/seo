import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { Hero } from "@/components/sections/Hero";
import { TrustBadges } from "@/components/sections/TrustBadges";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { ProcessSection } from "@/components/sections/ProcessSection";
import { OutputsSection } from "@/components/sections/OutputsSection";
import { AiSearchSection } from "@/components/sections/AiSearchSection";
import { AutopilotModesSection } from "@/components/sections/AutopilotModesSection";
import { MonthlyHowItWorksSection } from "@/components/sections/MonthlyHowItWorksSection";
import { MarketingPricingPreview } from "@/components/sections/MarketingPricingPreview";
import { CTASection } from "@/components/sections/CTASection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.home.title,
    description: dict.meta.home.description,
    path: "/",
    locale,
    keywords: SEO_KEYWORDS[locale],
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="marketing-page">
      <Hero locale={locale} dict={dict} />
      <TrustBadges dict={dict} />
      <ProblemSection dict={dict} />
      <SolutionSection dict={dict} />
      <ProcessSection dict={dict} theme="marketing" />
      <MonthlyHowItWorksSection dict={dict} />
      <OutputsSection dict={dict} />
      <AiSearchSection dict={dict} />
      <AutopilotModesSection dict={dict} />
      <MarketingPricingPreview locale={locale as Locale} dict={dict} />
      <CTASection locale={locale as Locale} dict={dict} theme="marketing" />
    </div>
  );
}
