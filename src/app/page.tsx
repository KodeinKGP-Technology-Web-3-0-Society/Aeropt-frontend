"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import LandingPage from "@/components/marketing/LandingPage";

export default function Home() {
  const { isLoggedIn, authLoading, onboardingCompleted, onboardingLoading } = useApp();
  const router = useRouter();

  // Already signed in? Send them straight to their actual app instead of the
  // pitch. Rendered without gating the landing page on this resolving first —
  // most visitors to "/" are logged out, and they shouldn't wait on an auth
  // check that doesn't apply to them.
  useEffect(() => {
    if (!authLoading && !onboardingLoading && isLoggedIn) {
      router.replace(onboardingCompleted ? "/home" : "/onboarding");
    }
  }, [authLoading, onboardingLoading, isLoggedIn, onboardingCompleted, router]);

  return <LandingPage />;
}
