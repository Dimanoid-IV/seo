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
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-[520px] w-[520px] rounded-full bg-[rgba(129,219,219,0.16)] blur-[110px]" />
        <div className="absolute -right-20 top-28 h-[460px] w-[460px] rounded-full bg-[#c9bfff]/35 blur-[105px]" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-6 py-20 sm:py-24 lg:px-10 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 rounded-full border-[#c9bfff]/50 bg-[#c9bfff]/20 text-[#8169ff]"
            >
              <Sparkles className="mr-1.5 h-3 w-3" />
              {dict.hero.badge}
            </Badge>

            <h1 className="font-[var(--font-gilroy)] text-4xl font-bold leading-[1.12] tracking-normal text-black sm:text-5xl lg:text-[3.875rem]">
              {dict.hero.title}
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#555555]">
              {dict.hero.subtitle}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                event="audit_preview_click"
                locale={locale}
                eventProperties={{ cta: "hero_audit", source: "landing" }}
                href="/audit"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "inline-flex h-12 rounded-xl bg-[#8169ff] px-8 font-[var(--font-gilroy)] text-base font-bold text-white hover:bg-[#6d4ff0]"
                )}
              >
                {dict.hero.ctaAudit}
                <ArrowRight className="ml-2 h-4 w-4" />
              </TrackedLink>
              <TrackedLink
                event="register_click"
                locale={locale}
                eventProperties={{ cta: "hero_primary", source: "landing" }}
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "inline-flex h-12 rounded-xl border-[#999999]/40 bg-white px-8 font-[var(--font-gilroy)] text-base font-bold text-[#181818] hover:bg-black/[0.04]"
                )}
              >
                {dict.hero.ctaPrimary}
              </TrackedLink>
              <ButtonLink
                locale={locale}
                href="/#how-it-works"
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-[#999999]/40 bg-white px-8 text-base text-[#181818] hover:bg-black/[0.04]"
              >
                {dict.hero.ctaSecondary}
              </ButtonLink>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[#555555]">
              {dict.hero.trustLine}
            </p>
          </motion.div>

          <HeroDashboard dict={dict} />
        </div>
      </div>
    </section>
  );
}
