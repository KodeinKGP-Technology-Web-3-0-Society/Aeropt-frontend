"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { OverviewGroup, SyllabusUnit } from "@/lib/api/study";
import {
  displayTitle,
  flattenAndSortConcepts,
  getDefaultActiveTab,
  type TabCounts,
  type TabKind,
} from "@/lib/studyOverview";
import TopicRow from "./TopicRow";

interface TopicsPanelProps {
  needsReviewGroups: OverviewGroup[];
  inProgressGroups: OverviewGroup[];
  exploredGroups: OverviewGroup[];
  masteredGroups: OverviewGroup[];
  counts: TabCounts;
  syllabus: SyllabusUnit[];
}

const TABS: Array<{ key: TabKind; label: string; countKey: keyof TabCounts }> = [
  { key: "review", label: "Needs review", countKey: "needs_review" },
  { key: "in_progress", label: "In progress", countKey: "in_progress" },
  { key: "explored", label: "Explored", countKey: "explored" },
  { key: "mastered", label: "Mastered", countKey: "mastered" },
];

const PREVIEW_LIMIT = 5;
const TAB_STORAGE_KEY = "jeepath_study_active_tab";
const EXPANDED_STORAGE_KEY = "jeepath_study_topics_expanded";

export default function TopicsPanel({
  needsReviewGroups,
  inProgressGroups,
  exploredGroups,
  masteredGroups,
  counts,
  syllabus,
}: TopicsPanelProps) {
  // Compute initial tab from localStorage if non-zero, otherwise pick default actionable tab
  const [activeTab, setActiveTab] = useState<TabKind>(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabKind | null;
      if (saved && ["review", "in_progress", "explored", "mastered"].includes(saved)) {
        const countKey = TABS.find((t) => t.key === saved)?.countKey;
        if (countKey && counts[countKey] > 0) return saved;
      }
    } catch {
      /* ignore storage access error */
    }
    return getDefaultActiveTab(counts);
  });

  const [showAll, setShowAll] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EXPANDED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const tabListRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: TabKind) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, tab);
    } catch {
      /* ignore */
    }
  };

  const handleToggleShowAll = () => {
    setShowAll((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXPANDED_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Keyboard navigation for accessible tabs (arrow keys)
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let targetIndex = currentIndex;
    if (e.key === "ArrowRight") {
      targetIndex = (currentIndex + 1) % TABS.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = TABS.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const targetTab = TABS[targetIndex];
    handleTabChange(targetTab.key);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[targetIndex]?.focus();
  };

  // Get current active groups and flattened concepts
  const activeGroups =
    activeTab === "review"
      ? needsReviewGroups
      : activeTab === "in_progress"
        ? inProgressGroups
        : activeTab === "explored"
          ? exploredGroups
          : masteredGroups;

  const allConcepts = flattenAndSortConcepts(activeGroups, activeTab);
  const totalInTab = allConcepts.length;
  const isBrandNew =
    counts.needs_review === 0 &&
    counts.in_progress === 0 &&
    counts.explored === 0 &&
    counts.mastered === 0;

  return (
    <div className="rounded-2xl border border-line bg-surface ">
      <div className="border-b border-line px-4 pt-2 sm:px-5">

        {/* Tab Bar / Segmented Control */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Topics by progress state"
          className="flex gap-2 sm:gap-3 overflow-x-auto pb-px"
        >
          {TABS.map((tab, idx) => {
            const count = counts[tab.countKey];
            const isSelected = activeTab === tab.key;
            const isZero = count === 0;

            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.key}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => handleTabChange(tab.key)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`relative flex min-h-11 cursor-pointer items-center gap-2 border-b-2 px-3 py-2 text-[15px] font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? "border-accent font-semibold text-ink"
                    : isZero
                      ? "border-transparent text-muted hover:text-ink"
                      : "border-transparent text-ink-2 hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs sm:text-xs tabular-nums font-medium ${
                    isSelected
                      ? "bg-hover text-ink font-semibold"
                      : isZero
                        ? "bg-hover/80 text-muted"
                        : "bg-hover text-ink-2"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panel Content Area with fixed min-height to prevent jumping */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex flex-col justify-between"
      >
        {totalInTab === 0 ? (
          <div className="flex items-center justify-center px-6 py-10 text-center">
            <p className="max-w-md text-[15px] leading-6 text-muted">
              {isBrandNew
                ? "Your topics will appear here as you begin studying."
                : activeTab === "review"
                  ? "Nothing due for review."
                  : activeTab === "in_progress"
                    ? "No topics in progress. Start any topic above to begin."
                    : activeTab === "explored"
                      ? "No topics explored in chat yet."
                      : "No topics mastered yet. Complete practice sessions to build mastery."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            {showAll ? (
              // Grouped by chapter when expanded
              <div className="divide-y divide-line/40">
                {activeGroups.map((group) => (
                  <div key={group.chapter} className="py-3">
                    <div className="bg-canvas/60 px-4 py-1.5 text-[13px] leading-5 font-medium text-muted sm:px-5">
                      {displayTitle(group.chapter)}
                    </div>
                    <ul className="mt-1">
                      {group.concepts.map((concept) => (
                        <TopicRow key={concept.concept_id} concept={concept} tab={activeTab} syllabus={syllabus} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              // Compact flat list of top PREVIEW_LIMIT concepts
              <ul className="divide-y divide-line/40">
                {allConcepts.slice(0, PREVIEW_LIMIT).map((concept) => (
                  <TopicRow key={concept.concept_id} concept={concept} tab={activeTab} syllabus={syllabus} />
                ))}
              </ul>
            )}

            {/* Expansion footer */}
            {totalInTab > PREVIEW_LIMIT && (
              <div className="border-t border-line/60 p-3.5 sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={handleToggleShowAll}
                  className="cursor-pointer text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {showAll ? "Show less" : `View all ${totalInTab}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
