"use client";

import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { ContactForm } from "@/components/forms/ContactForm";

type ContactFormSectionProps = {
  locale: Locale;
  dict: Dictionary;
};

function FormSkeleton() {
  return (
    <div className="glass-card h-[600px] animate-pulse rounded-2xl p-8" />
  );
}

export function ContactFormSection({ locale, dict }: ContactFormSectionProps) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <ContactForm locale={locale} dict={dict} />
    </Suspense>
  );
}
