import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import SettingsContent from "@/components/SettingsContent";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05060c] text-white">
        <StudySidebar />
        <SettingsContent />
      </div>
    </AuthGuard>
  );
}

