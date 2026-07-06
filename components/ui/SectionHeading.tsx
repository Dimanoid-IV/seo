import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  theme?: "dark" | "marketing";
  className?: string;
};

export function SectionHeading({
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
