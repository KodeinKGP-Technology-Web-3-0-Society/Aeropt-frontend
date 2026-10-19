"use client";

import Link from "next/link";
import type { OverviewConcept, SyllabusUnit } from "@/lib/api/study";
import { conceptAction, displayTitle, formatRelativeTime, subjectForLabel, type TabKind } from "@/lib/studyOverview";
import { StatusPill, statusFromTone, SubjectMark } from "./studyChrome";

export default function TopicRow({
  concept,
  tab,
  syllabus,
}: {
  concept: OverviewConcept;
  tab: TabKind;
  syllabus: SyllabusUnit[];
}) {
  const action = conceptAction(concept, tab);
  const relativeTime = formatRelativeTime(concept.last_practised);
  const subject = subjectForLabel(concept.chapter, syllabus) || subjectForLabel(concept.name, syllabus);

  return (
    <li>
      <Link
        href={action.href}
        className="group flex min-h-14 items-center gap-3 px-4 py-2 transition-colors duration-150 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:px-5"
      >
        <SubjectMark subject={subject} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-6 font-medium text-ink">{displayTitle(concept.name)}</span>
          <span className="block truncate text-[13px] leading-5 text-muted">{displayTitle(concept.chapter)}</span>
        </span>
        <StatusPill
          status={statusFromTone(action.tone)}
          label={tab === "explored" ? "Explored" : undefined}
        />
        {relativeTime && <span className="hidden w-24 shrink-0 text-right text-[13px] leading-5 text-muted md:inline">{relativeTime}</span>}
        <span className="inline-flex min-h-11 min-w-[5.5rem] shrink-0 items-center justify-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink-2 transition-colors duration-150 group-hover:bg-hover group-hover:text-ink">
          {action.label}
        </span>
      </Link>
    </li>
  );
}
