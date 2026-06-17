"use client";

import { useState } from "react";
import { Menu, X, TrendingUp } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getContactPath } from "@/lib/contact-links";

type HeaderProps = {
  locale: Locale;
  dict: Dictionary;
};

const navItems = [
  { key: "home" as const, href: "/" },
  { key: "services" as const, href: "/services" },
  { key: "pricing" as const, href: "/pricing" },
  { key: "blog" as const, href: "/blog" },
  { key: "contact" as const, href: "/contact" },
];

export function Header({ locale, dict }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <LocaleLink
          locale={locale}
          href="/"
          className="flex items-center gap-2 font-bold text-white"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg">
            Rank<span className="gradient-text">Boost</span>.eu
          </span>
        </LocaleLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <LocaleLink
              key={item.key}
              locale={locale}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {dict.nav[item.key]}
            </LocaleLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher currentLocale={locale} />
          <ButtonLink
            locale={locale}
            href={getContactPath({ service: "seo-audit", source: "header" })}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
          >
            {dict.nav.cta}
          </ButtonLink>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher currentLocale={locale} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="inline-flex size-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-white/10 bg-[#050816] w-72"
            >
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => (
                  <LocaleLink
                    key={item.key}
                    locale={locale}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-4 py-3 text-base text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {dict.nav[item.key]}
                  </LocaleLink>
                ))}
                <ButtonLink
                  locale={locale}
                  href={getContactPath({ service: "seo-audit", source: "header" })}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-violet-600"
                  onClick={() => setOpen(false)}
                >
                  {dict.nav.cta}
                </ButtonLink>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
