import { ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { LocaleLink } from "@/components/ui/LocaleLink";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  locale: Locale;
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ locale, items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {item.href ? (
              <LocaleLink
                locale={locale}
                href={item.href}
                className="hover:text-white transition-colors"
              >
                {item.label}
              </LocaleLink>
            ) : (
              <span className="text-slate-300 line-clamp-1">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
