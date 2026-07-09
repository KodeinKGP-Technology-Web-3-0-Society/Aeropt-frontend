"use client";

import React from "react";
import { useApp } from "@/components/AppContext";
import LoginScreen from "@/components/LoginScreen";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, authLoading } = useApp();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50">
        <p className="text-sm dark:text-slate-400 text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
