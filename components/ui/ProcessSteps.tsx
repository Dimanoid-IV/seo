type ProcessStep = {
  title: string;
  description?: string;
};

type ProcessStepsProps = {
  steps: ProcessStep[];
};

export function ProcessSteps({ steps }: ProcessStepsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => (
        <div key={step.title} className="relative">
          <div className="glass-card h-full p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
              {index + 1}
            </div>
            <h3 className="text-base font-semibold leading-snug text-white">
              {step.title}
            </h3>
            {step.description && (
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
