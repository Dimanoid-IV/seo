import { AppDashboardPage } from "@/components/dashboard/AppDashboardPage";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

export default function AppDashboardRoutePage() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <OnboardingBanner />
      </div>
      <AppDashboardPage />
    </>
  );
}
