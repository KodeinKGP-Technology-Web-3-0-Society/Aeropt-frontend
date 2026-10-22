"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";

function PracticeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return null;
}

export default function PracticePage() {
  return (
    <AuthGuard>
      <PracticeRedirect />
    </AuthGuard>
  );
}
