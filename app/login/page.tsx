import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в кабинет RankBoost",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="hero-grid flex min-h-screen items-center justify-center bg-[#050816] px-4 py-12">
      <AuthCard
        title="Вход в кабинет"
        subtitle="Управляйте SEO, контентом и ростом сайта"
      >
        <LoginForm />
      </AuthCard>
    </main>
  );
}
