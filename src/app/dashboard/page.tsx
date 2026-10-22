"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardRedirect />
    </AuthGuard>
  );
}
