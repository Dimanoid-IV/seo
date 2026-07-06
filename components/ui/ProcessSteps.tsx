type ProcessStep = {
  title: string;
  description?: string;
};

type ProcessStepsProps = {
  steps: ProcessStep[];
  theme?: "dark" | "marketing";
};

export function ProcessSteps({ steps, theme = "dark" }: ProcessStepsProps) {
  const isMarketing = theme === "marketing";

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="relative">
          <div
            className={
              isMarketing
                ? "marketing-card h-full"
                : "glass-card h-full p-6"
            }
          >
            <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-[0_4px_14px_-4px_rgba(59,130,246,0.5)]">
              {index + 1}
            </div>
            <h3
              className={
                isMarketing
                  ? "text-base font-semibold leading-snug text-slate-900"
                  : "text-base font-semibold leading-snug text-white"
              }
            >
              {step.title}
            </h3>
            {step.description ? (
              <p
                className={
                  isMarketing
                    ? "mt-2 text-sm leading-relaxed text-slate-600"
                    : "mt-2 text-sm leading-relaxed text-slate-400"
                }
              >
                {step.description}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
