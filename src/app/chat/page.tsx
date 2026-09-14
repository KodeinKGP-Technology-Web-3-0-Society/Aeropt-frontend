"use client";

import AuthGuard from "@/components/AuthGuard";
import { createChatSession } from "@/lib/agent";
import { getSupabaseUserId } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

/** Dedupes Strict Mode double-mount so /chat does not create two sessions. */
let inflightCreate: Promise<string> | null = null;

function createSessionOnce(userId: string): Promise<string> {
  if (!inflightCreate) {
    inflightCreate = createChatSession(userId).finally(() => {
      inflightCreate = null;
    });
  }
  return inflightCreate;
}

function CreateSessionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const userId = getSupabaseUserId();
      if (!userId) {
        if (!cancelled) setError("Sign in to start a study session.");
        return;
      }
      if (!cancelled) setError("");
      try {
        const sessionId = await createSessionOnce(userId);
        if (cancelled) return;
        const qs = searchParams.toString();
        router.replace(qs ? `/chat/${sessionId}?${qs}` : `/chat/${sessionId}`);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not start a session.");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, retryToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas text-ink px-6">
      {error ? (
        <>
          <p className="text-center text-sm text-red-500 max-w-md">{error}</p>
          <button
            type="button"
            className="rounded-lg bg-ink text-canvas px-4 py-2 text-sm font-medium "
            onClick={() => setRetryToken((n) => n + 1)}
          >
            Retry
          </button>
        </>
      ) : (
        <p className="text-sm opacity-80">Starting session…</p>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
            Starting session…
          </div>
        }
      >
        <CreateSessionRedirect />
      </Suspense>
    </AuthGuard>
  );
}
