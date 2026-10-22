"use client";

import AuthGuard from "@/components/AuthGuard";
import StudyRoom from "@/components/study-room/StudyRoom";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

function StudyRoomClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const conceptParam = searchParams.get("concept") || "";
  const decodedConceptId = conceptParam ? decodeURIComponent(conceptParam).trim() : "";
  const sessionId = searchParams.get("session") || null;
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "practice" ? "practice" : "learn";
  const sourceParam = searchParams.get("source");
  const source = sourceParam === "pyq" ? "pyq" : "any";

  useEffect(() => {
    if (!decodedConceptId) {
      router.replace("/study");
    }
  }, [decodedConceptId, router]);

  if (!decodedConceptId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
        <p className="text-sm text-muted">Redirecting to study overview…</p>
      </div>
    );
  }

  return (
    <StudyRoom
      key={`${sessionId ?? decodedConceptId}:${mode}:${source}`}
      conceptId={decodedConceptId}
      sessionId={sessionId}
      mode={mode}
      questionSource={source}
    />
  );
}

export default function StudyRoomPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
          </div>
        }
      >
        <StudyRoomClient />
      </Suspense>
    </AuthGuard>
  );
}
