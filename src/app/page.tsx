"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import LoginScreen from "@/components/LoginScreen";

export default function Home() {
  const { isLoggedIn, authLoading, onboardingCompleted, onboardingLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !onboardingLoading && isLoggedIn) {
      router.replace(onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [authLoading, onboardingLoading, isLoggedIn, onboardingCompleted, router]);

  if (authLoading || (isLoggedIn && onboardingLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}
