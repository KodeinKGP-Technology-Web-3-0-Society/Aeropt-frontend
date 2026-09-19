import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import SettingsContent from "@/components/settings/SettingsContent";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <SettingsContent />
      </div>
    </AuthGuard>
  );
}

