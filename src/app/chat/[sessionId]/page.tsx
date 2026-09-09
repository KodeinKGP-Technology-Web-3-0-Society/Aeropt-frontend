"use client";

import AuthGuard from "@/components/AuthGuard";
import ChatWorkspace from "@/components/ChatWorkspace";
import { Suspense, use } from "react";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

export default function ChatSessionPage({ params }: PageProps) {
  const { sessionId } = use(params);

  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas text-ink">
            Loading chat...
          </div>
        }
      >
        <ChatWorkspace sessionId={sessionId} />
      </Suspense>
    </AuthGuard>
  );
}
