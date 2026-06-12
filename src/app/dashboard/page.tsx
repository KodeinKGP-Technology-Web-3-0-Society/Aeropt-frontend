import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05060c] text-white">
        <StudySidebar />
        <DashboardContent />
      </div>
    </AuthGuard>
  );
}

