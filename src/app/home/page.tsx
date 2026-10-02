import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import HomeContent from "@/components/home/HomeContent";

export default function HomePage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-canvas text-ink">
        <StudySidebar />
        <HomeContent />
      </div>
    </AuthGuard>
  );
}
