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
      <div className="mx-auto flex w-full max-w-6xl xl:max-w-7xl flex-col gap-8 sm:gap-10">
        {/* Header */}
        <header className="flex items-baseline justify-between gap-4 pt-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl lg:text-4xl">
            What are we learning today?
          </h1>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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

        {error ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-base text-danger">
            {error}
          </p>
        ) : !overview ? (
          <OverviewSkeleton />
        ) : (
          <>
            {/* 1. Hero action: Top recommendation */}
            <ContinueCard items={overview.up_next} />

            {/* 2. Secondary entry: Compact Search */}
            <TopicSearch initialMode={initialMode} />

            {/* 3. Where you stand: Unified Topics Panel */}
            <TopicsPanel
              needsReviewGroups={overview.needs_review}
              inProgressGroups={split.inProgressGroups}
              exploredGroups={split.exploredGroups}
              masteredGroups={overview.mastered}
              counts={counts}
            />

            {/* 4. Syllabus Progress summary */}
            <CoverageSummary overview={overview} />
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
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <Suspense fallback={<div className="flex-1 bg-canvas" />}>
          <StudyHome />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
