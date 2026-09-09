import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import RoadmapContent from "@/components/RoadmapContent";

export default function RoadmapPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <RoadmapContent />
      </div>
    </AuthGuard>
  );
}
