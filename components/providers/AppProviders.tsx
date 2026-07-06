"use client";

import { SaasLocaleProvider } from "@/lib/i18n/saas/SaasLocaleProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SaasLocaleProvider>{children}</SaasLocaleProvider>;
}
