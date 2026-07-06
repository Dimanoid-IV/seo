import { Suspense } from "react";

import { IntegrationsPage } from "@/components/integrations/IntegrationsPage";
import { PageLoadingState } from "@/components/shared/PageLoadingState";

export default function AppIntegrationsRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState message="Loading integrations…" />}>
      <IntegrationsPage />
    </Suspense>
  );
}
