import AuthGuard from "@/components/AuthGuard";
import { AppShell } from "@/components/AppPage";
import StudySidebar from "@/components/study/StudySidebar";
import ProgressContent from "@/components/progress/ProgressContent";

export default function ProgressPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <AppShell>
        <StudySidebar />
        <ProgressContent />
      </AppShell>
    </AuthGuard>
  );
}
