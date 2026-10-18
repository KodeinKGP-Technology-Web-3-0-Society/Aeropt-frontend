"use client";

import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import TutorChat from "@/components/tutorchat/TutorChat";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";

/** General tutor chat: any doubt, any topic, with its own history. The open chat
 * lives in `?c=<session id>` so a refresh or a shared link reopens it. Room
 * sessions (Study Room, lesson, doubt) are not listed here; the tutor still sees
 * them through the cross-room digest. */
function GeneralChat() {
  const params = useSearchParams();
  const initial = (params.get("c") || "").trim() || null;

  const onSessionChange = useCallback((id: string | null) => {
    const url = id ? `/chat?c=${encodeURIComponent(id)}` : "/chat";
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <ErrorBoundary
      scope="GeneralChat"
      resetKey={initial}
      title="This chat hit a snag"
      description="Your messages and progress are saved on the server. Reload to pick the conversation back up."
    >
      <TutorChat initialSessionId={initial} onSessionChange={onSessionChange} />
    </ErrorBoundary>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <Suspense
          fallback={
            <main className="flex flex-1 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
            </main>
          }
        >
          <GeneralChat />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
