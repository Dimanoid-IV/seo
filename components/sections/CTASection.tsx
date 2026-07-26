"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CTASectionProps = {
  locale: Locale;
  dict: Dictionary;
  theme?: "dark" | "marketing";
  source?: string;
};

export function CTASection({
  locale,
  dict,
  theme = "dark",
  source = "cta",
}: CTASectionProps) {
  const isMarketing = theme === "marketing";

  return (
    <section
      className={isMarketing ? "marketing-section pb-24" : "py-20 lg:py-28"}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={
            isMarketing
              ? "relative overflow-hidden rounded-3xl border border-[#c9bfff]/55 bg-gradient-to-br from-[#8169ff] to-violet-700 p-10 text-center shadow-[0_24px_60px_-20px_rgba(59,130,246,0.45)] sm:p-14"
              : "relative overflow-hidden rounded-3xl border border-[#c9bfff]/40 bg-gradient-to-br from-[#8169ff]/15 via-violet-600/10 to-[#c9bfff]/20 p-12 text-center glow-blue"
          }
        >
          <div className="relative">
            <h2
              className={
                isMarketing
                  ? "text-3xl font-bold tracking-tight text-white md:text-4xl"
                  : "text-3xl font-bold text-white md:text-4xl lg:text-5xl"
              }
            >
              {dict.cta.title}
            </h2>
            <p
              className={
                isMarketing
                  ? "mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white"
                  : "mx-auto mt-4 max-w-xl text-lg text-slate-300"
              }
            >
              {dict.cta.subtitle}
            </p>
            <TrackedLink
              event="register_click"
              locale={locale}
              eventProperties={{ cta: "footer", source }}
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                isMarketing
                  ? "mt-8 inline-flex h-12 rounded-xl bg-white px-10 text-base font-medium text-[#6d4ff0] hover:bg-[#c9bfff]/20"
                  : "mt-8 h-12 bg-[#8169ff] px-10 text-base hover:bg-[#6d4ff0]"
              )}
            >
              {dict.cta.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </TrackedLink>
            <p
              className={
                isMarketing
                  ? "mt-4 text-sm text-white/90"
                  : "mt-4 text-sm text-slate-400"
              }
            >
              {dict.cta.note}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
