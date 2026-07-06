"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, X } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { buttonVariants } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

function isHomePath(pathname: string): boolean {
  return /^\/(ru|et|en)\/?$/.test(pathname);
}

export function Header({ locale, dict }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = isHomePath(pathname ?? "");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 backdrop-blur-xl",
        isHome
          ? "border-b border-slate-200/80 bg-white/85"
          : "border-b border-white/5 bg-[#050816]/80"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <LocaleLink
          locale={locale}
          href="/"
          className={cn(
            "flex items-center gap-2.5 font-bold",
            isHome ? "text-slate-900" : "text-white"
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_4px_14px_-4px_rgba(59,130,246,0.45)]">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-lg tracking-tight">
            Rank<span className="text-blue-600">Boost</span>
          </span>
        </LocaleLink>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <LocaleLink
              key={item.key}
              locale={locale}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                isHome
                  ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              {dict.nav[item.key]}
            </LocaleLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher currentLocale={locale} />
          <Link
            href="/login"
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              isHome
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            {dict.nav.login}
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500"
            )}
          >
            {dict.nav.cta}
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher currentLocale={locale} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-lg",
                isHome
                  ? "text-slate-700 hover:bg-slate-100"
                  : "text-white hover:bg-white/10"
              )}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-slate-200 bg-white"
            >
              <nav className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => (
                  <LocaleLink
                    key={item.key}
                    locale={locale}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {dict.nav[item.key]}
                  </LocaleLink>
                ))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-3 text-base text-slate-700 transition-colors hover:bg-slate-100"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants(),
                    "mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600"
                  )}
                >
                  {dict.nav.cta}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
