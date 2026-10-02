import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import PlanContent from "@/components/plan/PlanContent";

export default function PlanPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-canvas text-ink">
        <StudySidebar />
        <PlanContent />
      </div>
    </AuthGuard>
  );
}
