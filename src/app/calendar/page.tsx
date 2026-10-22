import { Metadata } from "next";
import CalendarContent from "@/components/calendar/CalendarContent";
import StudySidebar from "@/components/study/StudySidebar";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Calendar | JeePath",
};

export default function CalendarPage() {
  return (
    <AuthGuard>
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <CalendarContent />
      </div>
    </AuthGuard>
  );
}
