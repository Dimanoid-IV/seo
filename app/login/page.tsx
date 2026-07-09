import type { Metadata } from "next";

import { LoginPageContent } from "@/components/auth/LoginPageContent";

export const metadata: Metadata = {
  title: "Log in — RankBoost",
  description: "Log in to your RankBoost AI Growth Manager workspace.",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ plan?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginPageContent selectedPlan={params.plan?.trim() ?? ""} />;
}
