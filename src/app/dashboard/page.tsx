import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import DashboardContent from "@/components/DashboardContent";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <DashboardContent />
      </div>
    </AuthGuard>
  );
}

