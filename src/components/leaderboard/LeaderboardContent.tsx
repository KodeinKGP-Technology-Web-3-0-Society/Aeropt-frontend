"use client";

import { useEffect, useState } from "react";
import { getAccessToken, getApiBaseUrl } from "@/lib/api/auth";

type LeaderboardEntry = {
  rank: number;
  user_id: string;
  name: string;
  current_streak: number;
  highest_streak: number;
};

export default function LeaderboardContent() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const API_BASE_URL = getApiBaseUrl();
        const res = await fetch(`${API_BASE_URL}/users/leaderboard/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-24 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header>
          <p className="text-[11px] font-bold text-muted">Community</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Leaderboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            See how you stack up against the most consistent students on JeePath.
          </p>
        </header>

        <section>
          <div className="rounded-2xl border border-line bg-surface overflow-hidden">
            <div className="grid grid-cols-12 gap-4 border-b border-line bg-hover px-6 py-4 text-[11px] font-bold text-muted">
              <div className="col-span-2">Rank</div>
              <div className="col-span-6">Student</div>
              <div className="col-span-4 text-right">Streak</div>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-12 text-sm text-muted animate-pulse">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="flex justify-center p-12 text-sm text-muted">No students found.</div>
            ) : (
              <div className="divide-y divide-line">
                {entries.map((entry) => (
                  <div key={entry.user_id} className="grid grid-cols-12 items-center gap-4 px-6 py-5 transition-colors hover:bg-hover">
                    <div className="col-span-2 flex items-center gap-2 font-display text-xl font-bold">
                      {entry.rank === 1 && <span className="text-yellow-500">🥇</span>}
                      {entry.rank === 2 && <span className="text-gray-400">🥈</span>}
                      {entry.rank === 3 && <span className="text-amber-600">🥉</span>}
                      <span className={entry.rank <= 3 ? "text-ink" : "text-muted"}>
                        {entry.rank > 3 ? `#${entry.rank}` : ""}
                      </span>
                    </div>
                    <div className="col-span-6 font-semibold text-ink">
                      {entry.name}
                    </div>
                    <div className="col-span-4 text-right flex items-center justify-end gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-surface">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        {entry.current_streak}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
