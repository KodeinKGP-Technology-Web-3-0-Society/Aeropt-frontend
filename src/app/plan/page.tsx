import AuthGuard from "@/components/AuthGuard";
import { AppShell } from "@/components/AppPage";
import StudySidebar from "@/components/study/StudySidebar";
import PlanContent from "@/components/plan/PlanContent";

export default function PlanPage() {
  return (
    <AuthGuard>
      <AppShell>
        <StudySidebar />
        <PlanContent />
      </AppShell>
    </AuthGuard>
  );
}
