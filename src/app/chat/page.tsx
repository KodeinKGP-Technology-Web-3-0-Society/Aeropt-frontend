import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/StudySidebar";
import ChatContent from "@/components/ChatContent";

export default function ChatPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#05060c] text-white">
        <StudySidebar />
        <ChatContent />
      </div>
    </AuthGuard>
  );
}

