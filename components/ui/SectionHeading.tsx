import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  theme?: "dark" | "marketing";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  theme = "dark",
  className,
}: SectionHeadingProps) {
  const isMarketing = theme === "marketing";

  return (
    <div
      className={cn(
        "mb-12 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-3 text-sm font-semibold uppercase tracking-[0.18em]",
            isMarketing ? "text-[#8169ff]" : "text-[#81dbdb]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]",
          isMarketing ? "text-slate-900" : "text-white"
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed md:text-xl",
            isMarketing ? "text-slate-600" : "text-slate-400"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
