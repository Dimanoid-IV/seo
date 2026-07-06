import { AppDashboardPage } from "@/components/dashboard/AppDashboardPage";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

export default function AppDashboardRoutePage() {
  return (
    <>
      <div className="app-content mx-auto min-w-0 max-w-3xl overflow-x-hidden px-4 pt-4 sm:px-6 lg:px-8">
        <OnboardingBanner />
      </div>
      <AppDashboardPage />
    </>
  );
}
