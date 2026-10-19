"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import StudyHistory from "@/components/study-room/StudyHistory";
import { fetchStudyOverview, type StudyOverview } from "@/lib/api/study";
import { splitInProgressAndExplored, type TabCounts } from "@/lib/studyOverview";
import ContinueCard from "@/components/study/overview/ContinueCard";
import TopicSearch from "@/components/study/overview/TopicSearch";
import TopicsPanel from "@/components/study/overview/TopicsPanel";
import CoverageSummary from "@/components/study/overview/CoverageSummary";
import OverviewSkeleton from "@/components/study/overview/OverviewSkeleton";

function StudyHome() {
  const params = useSearchParams();
  const initialMode = params.get("mode") === "practice" ? "practice" : "learn";
  const [overview, setOverview] = useState<StudyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  useEffect(() => {
    let live = true;
    fetchStudyOverview()
      .then((o) => live && setOverview(o))
      .catch((e: unknown) =>
        live && setError(e instanceof Error ? e.message : "Could not load your study plan.")
      );
    return () => {
      live = false;
    };
  }, []);

  // Split in_progress into active practice vs chat-explored
  const { split, counts } = useMemo(() => {
    if (!overview) {
      return {
        split: { inProgressGroups: [], exploredGroups: [], inProgressCount: 0, exploredCount: 0 },
        counts: { needs_review: 0, in_progress: 0, explored: 0, mastered: 0 } as TabCounts,
      };
    }

    const s = splitInProgressAndExplored(overview.in_progress);
    const c: TabCounts = {
      needs_review: overview.counts.needs_review,
      in_progress: s.inProgressCount,
      explored: s.exploredCount,
      mastered: overview.counts.mastered,
    };

    return { split: s, counts: c };
  }, [overview]);

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-20 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
        <header id="study-top" className="flex items-center justify-between gap-4 scroll-mt-28">
          <h1 className="text-[32px] leading-10 font-semibold tracking-tight text-ink">Study</h1>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5M12 7v5l3 2" />
            </svg>
            Past sessions
          </button>
        </header>

        <nav aria-label="On this page" className="sticky top-14 z-30 -mx-4 border-b border-line bg-canvas/90 px-4 py-1 backdrop-blur sm:-mx-6 sm:px-6">
          <ul className="flex gap-1 overflow-x-auto">
            {[
              ["continue", "Continue"],
              ["start", "Start"],
              ["topics", "My topics"],
              ["progress", "Progress"],
              ["syllabus", "Syllabus"],
            ].map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {error ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-base text-danger">
            {error}
          </p>
        ) : !overview ? (
          <OverviewSkeleton />
        ) : (
          <>
            <section id="continue" className="scroll-mt-28" aria-labelledby="continue-heading">
              <h2 id="continue-heading" className="mb-3 text-xl leading-7 font-semibold text-ink">
                Continue
              </h2>
              <ContinueCard items={overview.up_next} syllabus={overview.syllabus} />
            </section>

            <section id="start" className="scroll-mt-28" aria-labelledby="start-heading">
              <h2 id="start-heading" className="mb-3 text-xl leading-7 font-semibold text-ink">
                Start something new
              </h2>
              <TopicSearch initialMode={initialMode} />
            </section>

            <section id="topics" className="scroll-mt-28" aria-labelledby="topics-heading">
              <h2 id="topics-heading" className="mb-3 text-xl leading-7 font-semibold text-ink">
                My topics
              </h2>
              <TopicsPanel
                needsReviewGroups={overview.needs_review}
                inProgressGroups={split.inProgressGroups}
                exploredGroups={split.exploredGroups}
                masteredGroups={overview.mastered}
                counts={counts}
                syllabus={overview.syllabus}
              />
            </section>

            <CoverageSummary overview={overview} />

            <a
              href="#study-top"
              className="inline-flex min-h-11 items-center self-start text-[15px] font-medium text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Back to top
            </a>
          </>
        )}
      </div>

      <StudyHistory open={historyOpen} onClose={closeHistory} />
    </main>
  );
}

export default function StudyIndexPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <div className="study-desk flex h-dvh bg-canvas">
        <StudySidebar />
        <Suspense fallback={<div className="flex-1 bg-canvas" />}>
          <StudyHome />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
