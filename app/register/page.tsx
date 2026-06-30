import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создайте аккаунт RankBoost",
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{ website?: string; previewToken?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const initialWebsite = params.website?.trim() ?? "";
  const initialPreviewToken = params.previewToken?.trim() ?? "";

  return (
    <main className="hero-grid flex min-h-screen items-center justify-center bg-[#050816] px-4 py-12">
      <AuthCard
        title="Регистрация"
        subtitle="Начните с бесплатного аккаунта RankBoost"
      >
        <RegisterForm
          initialWebsite={initialWebsite}
          initialPreviewToken={initialPreviewToken}
        />
      </AuthCard>
    </main>
  );
}
