import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import ProgressContent from "@/components/progress/ProgressContent";

export default function ProgressPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <main className="flex-1 overflow-y-auto px-4 pb-16 pt-24 sm:px-6">
          <ProgressContent />
        </main>
      </div>
    </AuthGuard>
  );
}
