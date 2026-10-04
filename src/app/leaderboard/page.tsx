import { Metadata } from "next";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import StudySidebar from "@/components/study/StudySidebar";

export const metadata: Metadata = {
  title: "Leaderboard | JeePath",
};

export default function LeaderboardPage() {
  return (
    <div className="flex h-dvh bg-canvas">
      <StudySidebar />
      <LeaderboardContent />
    </div>
  );
}
