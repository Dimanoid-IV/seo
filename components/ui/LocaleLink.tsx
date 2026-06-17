"use client";

import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LocaleLinkProps = {
  locale: Locale;
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function LocaleLink({
  locale,
  href,
  children,
  className,
  onClick,
}: LocaleLinkProps) {
  const path = getLocalizedPath(locale, href);
  return (
    <Link href={path} className={cn(className)} onClick={onClick}>
      {children}
    </Link>
  );
}
