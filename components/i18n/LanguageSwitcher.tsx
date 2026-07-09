"use client";

import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaasTranslationsOptional } from "@/lib/i18n/saas/SaasLocaleProvider";
import {
  SAAS_LOCALES,
  saasLocaleLabels,
  type SaasLocale,
} from "@/lib/i18n/saas/locales";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
  variant?: "app" | "auth";
};

export function LanguageSwitcher({
  className,
  variant = "app",
}: LanguageSwitcherProps) {
  const context = useSaasTranslationsOptional();
  if (!context) {
    return null;
  }

  const { locale, setLocale } = context;

  const triggerClass =
    variant === "auth"
      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value as SaasLocale)}
    >
      <SelectTrigger
        size="sm"
        className={cn("min-w-[7.5rem] rounded-xl", triggerClass, className)}
      >
        <Globe className="size-4 shrink-0" />
        <SelectValue>{saasLocaleLabels[locale]}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {SAAS_LOCALES.map((item) => (
          <SelectItem key={item} value={item}>
            {saasLocaleLabels[item]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
