import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LangSetter } from "@/components/layout/LangSetter";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { getOrganizationJsonLd } from "@/lib/json-ld";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);
  const organizationJsonLd = getOrganizationJsonLd({
    locale: locale as Locale,
    description: dict.meta.home.description,
  });

  return (
    <>
      <JsonLdScript data={organizationJsonLd} />
      <LangSetter locale={locale as Locale} />
      <Header locale={locale as Locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale as Locale} dict={dict} />
    </>
  );
}
