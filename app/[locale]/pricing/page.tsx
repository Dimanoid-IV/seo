import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { pricingFaqItems } from "@/data/pricing-faq";
import { getFAQJsonLd } from "@/lib/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { PricingSection } from "@/components/sections/PricingSection";
import { PricingFAQSection } from "@/components/sections/PricingFAQSection";
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
    keywords: SEO_KEYWORDS[locale],
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

  const faqJsonLd = getFAQJsonLd(
    pricingFaqItems.map((item) => ({
      question: item.question[loc],
      answer: item.answer[loc],
    }))
  );

  return (
    <>
      <JsonLdScript data={faqJsonLd} />
      <div className="border-b border-white/5 bg-gradient-to-b from-violet-600/10 to-transparent py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {dict.pricing.pageTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            {dict.pricing.pageSubtitle}
          </p>
        </div>
      </div>
      <PricingSection locale={loc} dict={dict} showComparison />
      <PricingFAQSection locale={loc} dict={dict} />
      <CTASection locale={loc} dict={dict} source="pricing" />
    </>
  );
}
