import AuthGuard from "@/components/AuthGuard";
import ChatWorkspace from "@/components/ChatWorkspace";

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatWorkspace />
    </AuthGuard>
  );
}

