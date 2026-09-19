import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import ProgressContent from "@/components/progress/ProgressContent";

export default function ProgressPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <ProgressContent />
      </div>
    </AuthGuard>
  );
}

