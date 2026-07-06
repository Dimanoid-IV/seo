import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/ru";
import { services } from "@/data/services";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/ui/ServiceCard";

type ServicesSectionProps = {
  locale: Locale;
  dict: Dictionary;
  detailed?: boolean;
  theme?: "dark" | "marketing";
  showHeading?: boolean;
};

export function ServicesSection({
  locale,
  dict,
  detailed = false,
  theme = "dark",
  showHeading = true,
}: ServicesSectionProps) {
  const isMarketing = theme === "marketing";

  return (
    <section className={isMarketing ? "marketing-section" : "py-20 lg:py-28"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {detailed && showHeading && (
          <SectionHeading
            theme={theme}
            title={dict.services.pageTitle}
            subtitle={dict.services.pageSubtitle}
          />
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locale={locale}
              ctaLabel={dict.services.ctaConsultation}
              whatsIncluded={dict.services.whatsIncluded}
              detailed={detailed}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
