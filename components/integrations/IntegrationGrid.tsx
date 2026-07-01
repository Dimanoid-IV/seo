import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import type { IntegrationOverviewItem } from "@/lib/integrations/types";
import { cn } from "@/lib/utils";

type IntegrationGridProps = {
  integrations: IntegrationOverviewItem[];
  onIntegrationAction?: (integration: IntegrationOverviewItem) => void;
  className?: string;
};

export function IntegrationGrid({
  integrations,
  onIntegrationAction,
  className,
}: IntegrationGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
        className
      )}
    >
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.provider}
          integration={integration}
          onActionClick={onIntegrationAction}
        />
      ))}
    </div>
  );
}
