import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import AuthGuard from "@/components/AuthGuard";

export default function OnboardingPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <OnboardingFlow />
    </AuthGuard>
  );
}
