import type { Metadata } from "next";

import { AuditPageContent } from "@/components/audit/AuditPageContent";

export const metadata: Metadata = {
  title: "Free website growth preview — SEO Autopilot | RankBoost",
  description:
    "See what your SEO Autopilot would look for first. RankBoost checks basic SEO and website signals, then shows growth opportunities.",
  openGraph: {
    title: "Free website growth preview — SEO Autopilot | RankBoost",
    description:
      "See what your SEO Autopilot would look for first. RankBoost checks basic SEO and website signals, then shows growth opportunities.",
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
