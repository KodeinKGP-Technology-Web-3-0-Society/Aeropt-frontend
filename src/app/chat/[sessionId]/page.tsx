"use client";

import AuthGuard from "@/components/AuthGuard";
import {
  buildAssessUrl,
  buildLessonUrl,
  fetchClassroomSession,
} from "@/lib/api/classroom";
import { ApiError } from "@/lib/api/auth";
import { Suspense, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

function ClassroomSessionRedirect({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const session = await fetchClassroomSession(sessionId);
        if (cancelled) return;

        const conceptId = (session.concept_id || "").trim();
        if (session.surface === "lesson" && conceptId) {
          router.replace(buildLessonUrl(conceptId));
          return;
        }
        if (session.surface === "doubt") {
          router.replace(conceptId ? `/doubt?concept=${encodeURIComponent(conceptId)}` : "/doubt");
          return;
        }
        if (session.surface === "assess") {
          router.replace(conceptId ? buildAssessUrl(conceptId) : "/home");
          return;
        }
        router.replace("/home");
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 404) {
          router.replace("/home");
          return;
        }
        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Could not open this session.";
        setError(message);
        router.replace("/home");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-6 text-ink">
      {error ? (
        <p className="max-w-md text-center text-sm text-danger">{error}</p>
      ) : (
        <p className="text-sm text-muted">Opening room…</p>
      )}
    </div>
  );
}

export default function ChatSessionPage({ params }: PageProps) {
  const { sessionId } = use(params);

  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
            Opening room…
          </div>
        }
      >
        <ClassroomSessionRedirect sessionId={sessionId} />
      </Suspense>
    </AuthGuard>
  );
}
