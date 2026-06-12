import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import PracticeContent from "@/components/PracticeContent";

export default function PraticePage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05060c] text-white">
        <StudySidebar />
        <PracticeContent />
      </div>
    </AuthGuard>
  );
}

