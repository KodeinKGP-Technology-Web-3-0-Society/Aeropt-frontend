"use client";

import { useEffect, useState } from "react";
import { getAccessToken, getApiBaseUrl } from "@/lib/api/auth";
import Link from "next/link";
import { lessonHref } from "@/lib/routes";

type CalendarEvent = {
  date: string;
  concept_id: string;
  title: string;
  chapter: string;
  estimated_minutes: number;
};

export default function CalendarContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCalendar() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const API_BASE_URL = getApiBaseUrl();
        const res = await fetch(`${API_BASE_URL}/classroom/calendar/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch calendar", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-24 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <header>
          <p className="text-[11px] font-bold text-muted">Study path</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            AI Planner
          </h1>
          <p className="mt-1 text-sm text-muted">
            Your personalised 30-day forecast. The AI optimizes this queue daily based on your mastery.
          </p>
        </header>

        <section>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center p-12 text-sm text-muted animate-pulse">Loading AI planner...</div>
            ) : events.length === 0 ? (
              <div className="flex justify-center p-12 text-sm text-muted">No scheduled events. Start your journey.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {events.map((evt, idx) => {
                  const eventDate = new Date(evt.date);
                  const isToday = idx === 0; // AI logic puts today first
                  return (
                    <div 
                      key={`${evt.concept_id}-${evt.date}`} 
                      className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        isToday ? "border-ink bg-ink text-surface" : "border-line bg-canvas hover:border-ink hover:shadow-sm"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] font-bold ${isToday ?"text-surface/80" : "text-muted"}`}>
                            {eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          {isToday && <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>}
                        </div>
                        <h3 className={`font-semibold text-sm line-clamp-2 ${isToday ? "text-surface" : "text-ink"}`}>
                          {evt.title}
                        </h3>
                        <p className={`mt-1 text-xs line-clamp-1 ${isToday ? "text-surface/70" : "text-muted"}`}>
                          {evt.chapter}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className={`text-xs font-medium ${isToday ? "text-surface/90" : "text-ink"}`}>
                          ~{evt.estimated_minutes} min
                        </span>
                        {isToday ? (
                          <Link href={lessonHref(evt.concept_id)} className="rounded bg-surface px-3 py-1.5 text-[11px] font-bold text-ink hover:bg-surface/90 transition-colors">
                            Start
                          </Link>
                        ) : (
                          <span className="text-[10px] font-bold text-muted">Planned</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
