import type { Metadata } from "next";

import { AdminGrowthDashboardPage } from "@/components/admin/AdminGrowthDashboardPage";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminDashboardRoutePage() {
  return <AdminGrowthDashboardPage />;
}
