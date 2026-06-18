import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, Clock } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, isValidLocale } from "@/lib/i18n";
import { generatePageMetadata, SEO_KEYWORDS } from "@/lib/seo";
import { PUBLIC_EMAIL } from "@/lib/site";
import { ContactFormSection } from "@/components/forms/ContactFormSection";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: dict.meta.contact.title,
    description: dict.meta.contact.description,
    path: "/contact",
    locale,
    keywords: SEO_KEYWORDS[locale],
  });
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <>
      <div className="border-b border-white/5 bg-gradient-to-b from-blue-600/10 to-transparent py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white md:text-5xl">
            {dict.contact.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            {dict.contact.subtitle}
          </p>
        </div>
      </div>
      <section className="py-20 scroll-mt-24" id="contact">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ContactFormSection locale={locale as Locale} dict={dict} />
            </div>
            <div className="lg:col-span-2">
              <div className="glass-card sticky top-24 space-y-6 p-8">
                <h2 className="text-xl font-semibold text-white">
                  {dict.contact.info.title}
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">{dict.contact.info.email}</p>
                    <a
                      href={`mailto:${PUBLIC_EMAIL}`}
                      className="mt-1 flex items-center gap-2 text-blue-400 hover:text-cyan-400"
                    >
                      <Mail className="h-4 w-4" />
                      {PUBLIC_EMAIL}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      {dict.contact.info.response}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-slate-300">
                      <Clock className="h-4 w-4 text-cyan-400" />
                      {dict.contact.info.responseTime}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm text-slate-400">{dict.cta.note}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
