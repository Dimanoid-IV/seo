"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/badge";
import { HeroDashboard } from "@/components/sections/HeroDashboard";
import { getContactPath } from "@/lib/contact-links";

type HeroProps = {
  locale: Locale;
  dict: Dictionary;
};

export function Hero({ locale, dict }: HeroProps) {
  return (
    <section className="relative overflow-hidden hero-grid">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-20 right-0 h-[400px] w-[500px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-600/10 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-blue-500/30 bg-blue-500/10 text-blue-300"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              {dict.hero.badge}
            </Badge>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
              {dict.hero.subtitle}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink
                locale={locale}
                href={getContactPath({ service: "seo-audit", source: "hero" })}
                size="lg"
                className="h-12 bg-gradient-to-r from-blue-600 to-violet-600 px-8 text-base hover:from-blue-500 hover:to-violet-500 glow-sm"
              >
                {dict.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                locale={locale}
                href="/pricing"
                variant="outline"
                size="lg"
                className="h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10"
              >
                {dict.hero.ctaSecondary}
              </ButtonLink>
            </div>
          </motion.div>

          <HeroDashboard dict={dict} />
        </div>
      </div>
    </section>
  );
}
