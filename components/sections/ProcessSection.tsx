import type { Dictionary } from "@/i18n/dictionaries/ru";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProcessSteps } from "@/components/ui/ProcessSteps";

type ProcessSectionProps = {
  dict: Dictionary;
  theme?: "dark" | "marketing";
};

export function ProcessSection({
  dict,
  theme = "dark",
}: ProcessSectionProps) {
  const isMarketing = theme === "marketing";

  return (
    <section
      id={isMarketing ? "how-it-works" : undefined}
      className={
        isMarketing
          ? "marketing-section"
          : "border-y border-white/5 bg-white/[0.02] py-20 lg:py-28"
      }
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          theme={theme}
          title={dict.process.title}
          subtitle={dict.process.subtitle}
        />
        <ProcessSteps steps={dict.process.steps} theme={theme} />
      </div>
    </section>
  );
}
