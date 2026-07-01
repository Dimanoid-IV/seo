import { Suspense } from "react";

import { IntegrationsPage } from "@/components/integrations/IntegrationsPage";
import { Loader2 } from "lucide-react";

function IntegrationsPageFallback() {
  return (
    <main className="app-content mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <Loader2 className="size-8 animate-spin text-blue-400" />
      <p className="mt-3 text-sm text-slate-400">Загружаем интеграции…</p>
    </main>
  );
}

export default function AppIntegrationsRoutePage() {
  return (
    <Suspense fallback={<IntegrationsPageFallback />}>
      <IntegrationsPage />
    </Suspense>
  );
}
