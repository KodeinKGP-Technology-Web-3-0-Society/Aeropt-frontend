import { Metadata } from "next";
import CalendarContent from "@/components/calendar/CalendarContent";
import StudySidebar from "@/components/study/StudySidebar";

export const metadata: Metadata = {
  title: "Calendar | Prepwise",
};

export default function CalendarPage() {
  return (
    <div className="flex h-dvh bg-canvas">
      <StudySidebar />
      <CalendarContent />
    </div>
  );
}
