import type { Locale } from "@/i18n/config";
import { LocaleLink } from "@/components/ui/LocaleLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonLinkProps = VariantProps<typeof buttonVariants> & {
  locale: Locale;
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function ButtonLink({
  locale,
  href,
  children,
  className,
  onClick,
  variant = "default",
  size = "default",
}: ButtonLinkProps) {
  return (
    <LocaleLink
      locale={locale}
      href={href}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </LocaleLink>
  );
}
