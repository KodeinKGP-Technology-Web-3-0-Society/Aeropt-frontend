import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import SettingsContent from "@/components/SettingsContent";

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

