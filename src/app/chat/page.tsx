import AuthGuard from "@/components/AuthGuard";
import ChatWorkspace from "@/components/ChatWorkspace";
import { Suspense } from "react";

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50 dark:text-white text-slate-900">Loading chat...</div>}>
        <ChatWorkspace />
      </Suspense>
    </AuthGuard>
  );
}

