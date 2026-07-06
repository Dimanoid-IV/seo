import type { Metadata } from "next";

import { LoginPageContent } from "@/components/auth/LoginPageContent";

export const metadata: Metadata = {
  title: "Log in — RankBoost",
  description: "Log in to your RankBoost AI Growth Manager workspace.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginPageContent />;
}
