import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import ProgressContent from "@/components/ProgressContent";

export default function ProgressPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05060c] text-white">
        <StudySidebar />
        <ProgressContent />
      </div>
    </AuthGuard>
  );
}

