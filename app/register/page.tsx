import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт RankBoost",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="hero-grid flex min-h-screen items-center justify-center bg-[#050816] px-4 py-12">
      <AuthCard
        title="Регистрация"
        subtitle="Начните с бесплатного аккаунта RankBoost"
      >
        <RegisterForm />
      </AuthCard>
    </main>
  );
}
