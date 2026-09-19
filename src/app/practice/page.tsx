import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import PracticeContent from "@/components/practice/PracticeContent";

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

