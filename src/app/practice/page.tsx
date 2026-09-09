import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import PracticeContent from "@/components/PracticeContent";

export default function PracticePage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <PracticeContent />
      </div>
    </AuthGuard>
  );
}

