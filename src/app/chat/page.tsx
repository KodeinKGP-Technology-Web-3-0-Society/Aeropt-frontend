"use client";

import AuthGuard from "@/components/AuthGuard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Bare /chat no longer creates a blank tutor session — rooms own sessions. */
function RedirectHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
      <p className="text-sm text-muted">Returning home…</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <RedirectHome />
    </AuthGuard>
  );
}
