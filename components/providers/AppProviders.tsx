import { cookies } from "next/headers";

import { SaasLocaleProvider } from "@/lib/i18n/saas/SaasLocaleProvider";
import { readLocaleFromCookieStore } from "@/lib/i18n/saas/storage";

export async function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialLocale = readLocaleFromCookieStore((name) => cookieStore.get(name));

  return (
    <SaasLocaleProvider initialLocale={initialLocale}>
      {children}
    </SaasLocaleProvider>
  );
}
