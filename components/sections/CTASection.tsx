"use client";

import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getContactPath } from "@/lib/contact-links";

type CTASectionProps = {
  locale: Locale;
  dict: Dictionary;
  source?: string;
};

export function CTASection({ locale, dict, source = "cta" }: CTASectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-violet-600/10 to-cyan-600/10 p-12 text-center glow-blue"
        >
          <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {dict.cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              {dict.cta.subtitle}
            </p>
            <ButtonLink
              locale={locale}
              href={getContactPath({ source, service: "seo-audit" })}
              size="lg"
              className="mt-8 h-12 bg-gradient-to-r from-blue-600 to-violet-600 px-10 text-base hover:from-blue-500 hover:to-violet-500"
            >
              {dict.services.ctaConsultation}
            </ButtonLink>
            <p className="mt-4 text-sm text-slate-400">{dict.cta.note}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
