"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import LandingPage from "@/components/marketing/LandingPage";
import { isNative } from "@/native/platform";

export default function Home() {
  const { isLoggedIn, authLoading, onboardingCompleted, onboardingLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BUILD_TARGET === "android" || isNative()) {
      router.replace("/m/launch");
      return;
    }
    if (!authLoading && !onboardingLoading && isLoggedIn) {
      router.replace(onboardingCompleted ? "/home" : "/onboarding");
    }
  }, [authLoading, onboardingLoading, isLoggedIn, onboardingCompleted, router]);

  // For Android static export, don't mount the heavy desktop marketing landing page
  if (process.env.NEXT_PUBLIC_BUILD_TARGET === "android") {
    return null;
  }

  return <LandingPage />;
}
