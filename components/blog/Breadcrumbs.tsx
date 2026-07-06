import { ChevronRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  locale: Locale;
  items: BreadcrumbItem[];
  theme?: "dark" | "marketing";
};

export function Breadcrumbs({ locale, items, theme = "dark" }: BreadcrumbsProps) {
  const isMarketing = theme === "marketing";

  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1 text-sm",
          isMarketing ? "text-slate-500" : "text-slate-400"
        )}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {item.href ? (
              <LocaleLink
                locale={locale}
                href={item.href}
                className={cn(
                  "transition-colors",
                  isMarketing ? "hover:text-slate-900" : "hover:text-white"
                )}
              >
                {item.label}
              </LocaleLink>
            ) : (
              <span
                className={cn(
                  "line-clamp-1",
                  isMarketing ? "text-slate-700" : "text-slate-300"
                )}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
