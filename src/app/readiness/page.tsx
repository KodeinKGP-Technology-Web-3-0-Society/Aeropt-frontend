import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import ReadinessContent from "@/components/readiness/ReadinessContent";

export default function ReadinessPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <ReadinessContent />
      </div>
    </AuthGuard>
  );
}
