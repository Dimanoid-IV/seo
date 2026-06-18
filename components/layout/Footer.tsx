import { Mail, TrendingUp } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PUBLIC_EMAIL } from "@/lib/site";
import { services } from "@/data/services";
import { getContactPath } from "@/lib/contact-links";
import { getBlogPosts } from "@/data/blog-posts";
import { Separator } from "@/components/ui/separator";

type FooterProps = {
  locale: Locale;
  dict: Dictionary;
};

export function Footer({ locale, dict }: FooterProps) {
  const blogPosts = getBlogPosts(locale).slice(0, 3);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-[#030712]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="mb-4 flex items-center gap-2 font-bold text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <span>
                Rank<span className="gradient-text">Boost</span>.eu
              </span>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              {dict.footer.description}
            </p>
            <a
              href={`mailto:${PUBLIC_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-cyan-400"
            >
              <Mail className="h-4 w-4" />
              {PUBLIC_EMAIL}
            </a>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">
              {dict.footer.navigation}
            </h4>
            <ul className="space-y-2">
              {(
                [
                  ["home", "/"],
                  ["services", "/services"],
                  ["pricing", "/pricing"],
                  ["blog", "/blog"],
                  ["contact", getContactPath({ source: "footer" })],
                ] as const
              ).map(([key, href]) => (
                <li key={key}>
                  <LocaleLink
                    locale={locale}
                    href={href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {dict.nav[key]}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">
              {dict.footer.servicesTitle}
            </h4>
            <ul className="space-y-2">
              {services.slice(0, 5).map((service) => (
                <li key={service.id}>
                  <LocaleLink
                    locale={locale}
                    href="/services"
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {service.title[locale]}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">
              {dict.footer.blogTitle}
            </h4>
            <ul className="space-y-2">
              {blogPosts.map((post) => (
                <li key={post.slug}>
                  <LocaleLink
                    locale={locale}
                    href={`/blog/${post.slug}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white line-clamp-2"
                  >
                    {post.title}
                  </LocaleLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            {dict.footer.copyright.replace("{year}", String(year))}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <LocaleLink
              locale={locale}
              href="/privacy"
              className="text-sm text-slate-400 hover:text-white"
            >
              {dict.footer.privacy}
            </LocaleLink>
            <LocaleLink
              locale={locale}
              href="/terms"
              className="text-sm text-slate-400 hover:text-white"
            >
              {dict.footer.terms}
            </LocaleLink>
            <LanguageSwitcher currentLocale={locale} variant="footer" />
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-600">{dict.footer.disclaimer}</p>
      </div>
    </footer>
  );
}
