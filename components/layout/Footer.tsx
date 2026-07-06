import { Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PUBLIC_EMAIL } from "@/lib/site";
import { services } from "@/data/services";
import { getBlogPosts } from "@/data/blog-posts";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FooterProps = {
  locale: Locale;
  dict: Dictionary;
};

export function Footer({ locale, dict }: FooterProps) {
  const blogPosts = getBlogPosts(locale).slice(0, 3);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2 font-bold text-slate-900">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span>
                Rank<span className="text-blue-600">Boost</span>.eu
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              {dict.footer.description}
            </p>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              {dict.footer.trustNote}
            </p>
            <a
              href={`mailto:${PUBLIC_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Mail className="h-4 w-4" />
              {PUBLIC_EMAIL}
            </a>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900">
              {dict.footer.navigation}
            </h4>
            <ul className="space-y-2">
              {(
                [
                  ["home", "/"],
                  ["services", "/services"],
                  ["pricing", "/pricing"],
                  ["blog", "/blog"],
                  ["contact", "/contact"],
                ] as const
              ).map(([key, href]) => (
                <li key={key}>
                  <LocaleLink
                    locale={locale}
                    href={href}
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {dict.nav[key]}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900">
              {dict.footer.productTitle}
            </h4>
            <ul className="space-y-2">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <LocaleLink
                    locale={locale}
                    href="/services"
                    className="text-sm text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {service.title[locale]}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-slate-900">
              {dict.footer.blogTitle}
            </h4>
            <ul className="space-y-2">
              {blogPosts.map((post) => (
                <li key={post.slug}>
                  <LocaleLink
                    locale={locale}
                    href={`/blog/${post.slug}`}
                    className="line-clamp-2 text-sm text-slate-600 transition-colors hover:text-slate-900"
                  >
                    {post.title}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            {dict.footer.copyright.replace("{year}", String(year))}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">
              {dict.nav.login}
            </Link>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-500 hover:to-violet-500"
              )}
            >
              {dict.nav.cta}
            </Link>
            <LocaleLink
              locale={locale}
              href="/privacy"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {dict.footer.privacy}
            </LocaleLink>
            <LocaleLink
              locale={locale}
              href="/terms"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {dict.footer.terms}
            </LocaleLink>
            <LanguageSwitcher currentLocale={locale} variant="footer" />
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">{dict.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
