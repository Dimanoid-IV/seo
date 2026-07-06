import type { Metadata } from "next";

import { RegisterPageContent } from "@/components/auth/RegisterPageContent";

export const metadata: Metadata = {
  title: "Start free — RankBoost",
  description: "Create your RankBoost account and start improving your website.",
  robots: { index: false, follow: false },
};

type RegisterPageProps = {
  searchParams: Promise<{ website?: string; previewToken?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <RegisterPageContent
      initialWebsite={params.website?.trim() ?? ""}
      initialPreviewToken={params.previewToken?.trim() ?? ""}
    />
  );
}
