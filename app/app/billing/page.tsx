import { Suspense } from "react";

import { BillingPage } from "@/components/billing/BillingPage";
import { PageLoadingState } from "@/components/shared/PageLoadingState";

export default function AppBillingRoutePage() {
  return (
    <Suspense fallback={<PageLoadingState />}>
      <BillingPage />
    </Suspense>
  );
}
