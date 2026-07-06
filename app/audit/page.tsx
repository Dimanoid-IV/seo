import type { Metadata } from "next";

import { AuditPageContent } from "@/components/audit/AuditPageContent";

export const metadata: Metadata = {
  title: "Free website growth preview — RankBoost",
  description:
    "Get a quick preview of your website growth opportunities. RankBoost checks basic SEO signals and shows what could be improved.",
  openGraph: {
    title: "Free website growth preview — RankBoost",
    description:
      "Get a quick preview of your website growth opportunities. RankBoost checks basic SEO signals and shows what could be improved.",
  },
};

type AuditPageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const initialUrl = params.url?.trim() ?? "";

  return <AuditPageContent initialUrl={initialUrl} />;
}
