import { ArrowRight, Mail, MessageCircle } from "lucide-react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { getLocalizedPath } from "@/lib/i18n";
import { PUBLIC_EMAIL } from "@/lib/site";

type ContactCtaSectionProps = {
  locale: Locale;
  dict: Dictionary;
};

export function ContactCtaSection({ locale, dict }: ContactCtaSectionProps) {
  const formHref = `${getLocalizedPath(locale, "/contact")}#contact-form`;

  return (
    <section className="marketing-section">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-[#c9bfff]/55 bg-white p-8 shadow-[0_24px_70px_-42px_rgba(24,24,24,0.35)] sm:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8169ff]/25 bg-[#c9bfff]/20 px-3 py-1 text-sm font-medium text-[#6d4ff0]">
              <MessageCircle className="h-4 w-4" />
              {dict.contactCta.eyebrow}
            </div>
            <h2 className="max-w-3xl font-[var(--font-gilroy)] text-3xl font-bold tracking-normal text-[#181818] sm:text-4xl">
              {dict.contactCta.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#555555] sm:text-lg">
              {dict.contactCta.description}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedLink
                event="contact_click"
                locale={locale}
                eventProperties={{ cta: "homepage_contact", target: "form" }}
                href={formHref}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#8169ff] px-6 font-[var(--font-gilroy)] text-base font-bold text-white transition-colors hover:bg-[#6d4ff0]"
              >
                {dict.contactCta.formButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </TrackedLink>
              <a
                href={`mailto:${PUBLIC_EMAIL}`}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#999999]/40 bg-white px-6 font-[var(--font-gilroy)] text-base font-bold text-[#181818] transition-colors hover:bg-black/[0.04]"
              >
                <Mail className="mr-2 h-4 w-4 text-[#8169ff]" />
                {PUBLIC_EMAIL}
              </a>
            </div>
          </div>
          <aside className="rounded-3xl border border-[#81dbdb]/45 bg-[#81dbdb]/15 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#257575]">
              {dict.contactCta.emailLabel}
            </p>
            <a
              href={`mailto:${PUBLIC_EMAIL}`}
              className="mt-3 block break-all text-xl font-bold text-[#181818] hover:text-[#6d4ff0]"
            >
              {PUBLIC_EMAIL}
            </a>
            <p className="mt-5 text-sm leading-relaxed text-[#555555]">
              {dict.contactCta.responseTime}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
