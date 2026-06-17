"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { switchLocalePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  currentLocale: Locale;
  variant?: "header" | "footer";
};

export function LanguageSwitcher({
  currentLocale,
  variant = "header",
}: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg p-0.5",
        variant === "header" ? "bg-white/5 ring-1 ring-white/10" : "bg-white/5"
      )}
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={switchLocalePath(pathname, locale)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
            locale === currentLocale
              ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white"
              : "text-slate-400 hover:text-white"
          )}
          aria-current={locale === currentLocale ? "page" : undefined}
        >
          {localeNames[locale]}
        </Link>
      ))}
    </div>
  );
}
