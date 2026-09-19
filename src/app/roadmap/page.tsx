import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import RoadmapContent from "@/components/roadmap/RoadmapContent";

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
