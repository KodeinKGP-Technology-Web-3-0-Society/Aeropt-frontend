import AuthGuard from "@/components/AuthGuard";
import StudyRoom from "@/components/study-room/StudyRoom";

interface PageProps {
  params: Promise<{ conceptId: string }>;
  searchParams: Promise<{ session?: string | string[]; mode?: string | string[]; source?: string | string[] }>;
}

export default async function StudyPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const query = await searchParams;
  const decodedConceptId = decodeURIComponent(resolvedParams.conceptId);
  // ?session=<id> opens that exact session (from the history panel);
  // ?mode=practice skips theory; &source=pyq keeps to past-year questions.
  const sessionId = typeof query.session === "string" ? query.session : null;
  const mode = query.mode === "practice" ? "practice" : "learn";
  const source = query.source === "pyq" ? "pyq" : "any";

  return (
    <AuthGuard requireOnboarding={false}>
      <StudyRoom
        key={`${sessionId ?? decodedConceptId}:${mode}:${source}`}
        conceptId={decodedConceptId}
        sessionId={sessionId}
        mode={mode}
        questionSource={source}
      />
    </AuthGuard>
  );
}
