"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/AppContext";
import LoginScreen from "@/components/LoginScreen";

function AuthPageInner() {
  const { isLoggedIn, authLoading, onboardingCompleted, onboardingLoading } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  useEffect(() => {
    if (!authLoading && !onboardingLoading && isLoggedIn) {
      router.replace(onboardingCompleted ? "/home" : "/onboarding");
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
    return <LoginScreen initialTab={initialTab} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <p className="text-sm text-muted">Loading...</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <p className="text-sm text-muted">Loading...</p>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}
