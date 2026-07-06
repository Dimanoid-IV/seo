import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { services } from "@/data/services";
import { getServicesJsonLd } from "@/lib/json-ld";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { CTASection } from "@/components/sections/CTASection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.services.title,
    description: dict.meta.services.description,
    path: "/services",
    locale,
    keywords: SEO_KEYWORDS[locale],
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ServicesPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const loc = locale as Locale;

  const servicesJsonLd = getServicesJsonLd(
    loc,
    services.map((s) => ({
      name: s.title[loc],
      description: s.description[loc],
    }))
  );

  return (
    <div className="marketing-page min-h-screen">
      <JsonLdScript data={servicesJsonLd} />
      <div className="border-b border-slate-200/80 bg-gradient-to-b from-blue-50/80 to-white py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
            {dict.services.pageTitle}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {dict.services.pageSubtitle}
          </p>
        </div>
      </div>
      <ServicesSection locale={loc} dict={dict} detailed theme="marketing" showHeading={false} />
      <CTASection locale={loc} dict={dict} source="services" theme="marketing" />
    </div>
  );
}
