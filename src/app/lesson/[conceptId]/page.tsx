"use client";

import AuthGuard from "@/components/AuthGuard";
import ChatWorkspace from "@/components/chat/ChatWorkspace";
import StudySidebar from "@/components/study/StudySidebar";
import { ensureClassroomAgentSession } from "@/lib/api/classroom";
import { ApiError } from "@/lib/api/auth";
import { Suspense, use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{ conceptId: string }>;
};

function LessonRoom({ conceptId }: { conceptId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!conceptId) {
        if (!cancelled) setError("Missing concept.");
        return;
      }
      if (!cancelled) setError("");
      try {
        const session = await ensureClassroomAgentSession({
          surface: "lesson",
          concept_id: conceptId,
        });
        const id = (session.agent_session_id || "").trim();
        if (!id) {
          throw new Error("Could not bind a lesson session.");
        }
        if (!cancelled) setSessionId(id);
      } catch (caught) {
        if (cancelled) return;
        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Could not open this lesson.";
        setError(message);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [conceptId, retryToken]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-ink">
        <p className="max-w-md text-center text-sm text-danger">{error}</p>
        <button
          type="button"
          className="cursor-pointer rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover"
          onClick={() => setRetryToken((n) => n + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
        <p className="text-sm text-muted">Opening lesson…</p>
      </div>
    );
  }

  return <ChatWorkspace sessionId={sessionId} conceptId={conceptId} surface="lesson" />;
}

export default function LessonPage({ params }: PageProps) {
  const { conceptId: rawConceptId } = use(params);
  const conceptId = decodeURIComponent(rawConceptId);

  return (
    <AuthGuard>
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center bg-canvas text-ink">
              Opening lesson…
            </div>
          }
        >
          <LessonRoom conceptId={conceptId} />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
