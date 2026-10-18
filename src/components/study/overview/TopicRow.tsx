"use client";

import Link from "next/link";
import type { OverviewConcept } from "@/lib/api/study";
import { conceptAction, formatRelativeTime, type TabKind } from "@/lib/studyOverview";

interface TopicRowProps {
  concept: OverviewConcept;
  tab: TabKind;
}

const TONE_BADGE = {
  danger: "text-danger bg-danger/10 border-danger/25",
  warning: "text-warning bg-warning/10 border-warning/25",
  success: "text-success bg-success/10 border-success/25",
  muted: "text-muted bg-hover border-line",
};

export default function TopicRow({ concept, tab }: TopicRowProps) {
  const action = conceptAction(concept, tab);
  const relativeTime = formatRelativeTime(concept.last_practised);

  return (
    <li className="group flex min-h-[52px] sm:min-h-[56px] items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 transition-colors hover:bg-hover sm:px-6">
      {/* Left: Concept Name + Chapter */}
      <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
        <Link
          href={action.href}
          className="truncate text-sm sm:text-base font-medium text-ink transition-colors group-hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {concept.name}
        </Link>
        <span className="hidden truncate text-xs sm:text-sm text-muted sm:inline" title={concept.chapter}>
          · {concept.chapter}
        </span>
      </div>

      {/* Middle: Status Badge + Timestamp */}
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none ${TONE_BADGE[action.tone]}`}
        >
          {action.detail}
        </span>

        {relativeTime && (
          <span className="hidden text-xs sm:text-sm tabular-nums text-muted md:inline">
            {relativeTime}
          </span>
        )}
      </div>

      {/* Right: Direct Action Button */}
      <div className="shrink-0">
        <Link
          href={action.href}
          className="inline-flex min-h-[38px] sm:min-h-[40px] min-w-[76px] sm:min-w-[84px] items-center justify-center rounded-lg border border-line bg-surface px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-ink-2 shadow-2xs transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {action.label}
        </Link>
      </div>
    </li>
  );
}
