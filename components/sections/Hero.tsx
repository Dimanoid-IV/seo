"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroDashboard } from "@/components/sections/HeroDashboard";
import { cn } from "@/lib/utils";

type HeroProps = {
  locale: Locale;
  dict: Dictionary;
};

export function Hero({ locale, dict }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/4 h-[420px] w-[520px] rounded-full bg-blue-400/10 blur-[100px]" />
        <div className="absolute top-10 right-0 h-[360px] w-[420px] rounded-full bg-violet-400/10 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-blue-200 bg-blue-50 text-blue-700"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              {dict.hero.badge}
            </Badge>

            <h1 className="text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              {dict.hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              {dict.hero.subtitle}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                event="register_click"
                locale={locale}
                eventProperties={{ cta: "hero_primary", source: "landing" }}
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex h-12 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-base text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.45)] hover:from-blue-500 hover:to-violet-500"
                )}
              >
                {dict.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </TrackedLink>
              <ButtonLink
                locale={locale}
                href="/#how-it-works"
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-slate-300 bg-white px-8 text-base text-slate-700 hover:bg-slate-50"
              >
                {dict.hero.ctaSecondary}
              </ButtonLink>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-slate-500">
              {dict.hero.trustLine}
            </p>
          </motion.div>

          <HeroDashboard dict={dict} />
        </div>
      </div>
    </section>
  );
}
