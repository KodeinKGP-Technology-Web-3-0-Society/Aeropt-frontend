"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import LoginScreen from "@/components/LoginScreen";

export default function AuthGuard({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { isLoggedIn, authLoading, onboardingCompleted, onboardingLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading || onboardingLoading || !isLoggedIn) return;

    if (!onboardingCompleted && requireOnboarding && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (onboardingCompleted && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
  }, [
    authLoading,
    onboardingLoading,
    isLoggedIn,
    onboardingCompleted,
    requireOnboarding,
    pathname,
    router,
  ]);

  if (authLoading || (isLoggedIn && onboardingLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50">
        <p className="text-sm dark:text-slate-400 text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (!onboardingCompleted && requireOnboarding && pathname !== "/onboarding") {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50">
        <p className="text-sm dark:text-slate-400 text-slate-500">Redirecting to onboarding...</p>
      </div>
    );
  }

  return <>{children}</>;
}
