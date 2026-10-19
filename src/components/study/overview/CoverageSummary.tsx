"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CoverageChapter, StudyOverview, SyllabusUnit } from "@/lib/api/study";
import { calculateSyllabusStats, displayTitle, groupSyllabusBySubject } from "@/lib/studyOverview";
import { SegmentBar, StatRing, StatusLegend, StatusPill, subjectVar, ThickBar, type StudyStatus } from "./studyChrome";

const TOPIC_STATUS: Record<SyllabusUnit["topics"][number]["status"], StudyStatus> = {
  mastered: "mastered",
  started: "progress",
  review: "review",
  new: "new",
};

function topicSegments(unit: SyllabusUnit) {
  const counts = { mastered: 0, progress: 0, review: 0, fresh: 0 };
  if (unit.topics.length === 0) {
    counts.mastered = unit.mastered;
    counts.progress = Math.max(0, unit.started - unit.mastered);
    counts.fresh = Math.max(0, unit.total - unit.started);
    return counts;
  }
  for (const topic of unit.topics) {
    if (topic.status === "mastered") counts.mastered += 1;
    else if (topic.status === "review") counts.review += 1;
    else if (topic.status === "started") counts.progress += 1;
    else counts.fresh += 1;
  }
  return counts;
}

function UnitProgressCard({ chapter }: { chapter: CoverageChapter }) {
  const [open, setOpen] = useState(false);
  const first = chapter.next[0];
  const rest = chapter.next.slice(1);
  const moreCount = Math.max(rest.length, Math.max(0, chapter.remaining - (first ? 1 : 0)));
  const unnamed = Math.max(0, chapter.remaining - chapter.next.length);

  return (
    <li className="flex flex-col rounded-2xl border border-line bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-[15px] leading-6 font-semibold text-ink">{displayTitle(chapter.chapter)}</p>
        <span className="shrink-0 text-[13px] leading-5 font-medium tabular-nums text-muted">
          {chapter.started}/{chapter.total}
        </span>
      </div>
      <div className="mt-3">
        <ThickBar
          mastered={chapter.mastered}
          started={chapter.started}
          total={chapter.total}
          label={`${chapter.chapter}: ${chapter.started} of ${chapter.total} started, ${chapter.mastered} mastered`}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {first ? (
          <Link
            href={`/study/${encodeURIComponent(first.concept_id)}`}
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Next up: {displayTitle(first.name)}
          </Link>
        ) : (
          <p className="text-[13px] leading-5 font-medium text-success">All topics in this unit started.</p>
        )}
        {moreCount > 0 && (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {open ? "Show less" : `+${moreCount} more`}
          </button>
        )}
      </div>
      <div className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          {open && (
            <ul className="mt-3 space-y-1 border-t border-line pt-3">
              {rest.map((item) => (
                <li key={item.concept_id}>
                  <Link
                    href={`/study/${encodeURIComponent(item.concept_id)}`}
                    className="flex min-h-11 items-center text-[15px] leading-6 text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {displayTitle(item.name)}
                  </Link>
                </li>
              ))}
              {unnamed > 0 && (
                <li className="text-[13px] leading-5 text-muted">
                  {unnamed} more {unnamed === 1 ? "topic" : "topics"} in this unit
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function SyllabusBrowser({ units }: { units: SyllabusUnit[] }) {
  const groups = useMemo(() => groupSyllabusBySubject(units), [units]);
  const [subject, setSubject] = useState(groups[0]?.subject ?? "");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const active = groups.find((group) => group.subject === subject) ?? groups[0];
  if (!active) return null;

  const needle = query.trim().toLowerCase();
  const visible = active.units.filter((unit) => {
    if (!needle) return true;
    if (unit.unit.toLowerCase().includes(needle)) return true;
    return unit.topics.some((topic) => topic.topic.toLowerCase().includes(needle));
  });

  return (
    <div className="mt-4">
      <div className="sticky top-28 z-10 -mx-1 mb-4 bg-surface/95 px-1 py-2 backdrop-blur">
        <StatusLegend />
      </div>

      <label htmlFor="syllabus-filter" className="sr-only">
        Filter chapters
      </label>
      <input
        id="syllabus-filter"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Filter ${active.subject} chapters`}
        className="h-12 w-full rounded-xl border border-line bg-input px-3 text-[15px] text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent"
      />

      <div role="tablist" aria-label="Syllabus by subject" className="mt-4 flex flex-wrap gap-1 rounded-xl bg-hover p-1">
        {groups.map((group) => {
          const selected = group.subject === active.subject;
          const color = subjectVar(group.subject);
          return (
            <button
              key={group.subject}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setSubject(group.subject);
                setOpenKey(null);
              }}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={
                selected
                  ? { background: "var(--bg-surface)", color: "var(--text-main)" }
                  : { color: "var(--text-muted)" }
              }
            >
              <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
              {group.subject}
              <span className="tabular-nums">{group.units.length}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="px-1 py-8 text-[15px] leading-6 text-muted">No chapters match that filter.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {visible.map((unit) => {
            const key = `${active.subject}:${unit.unit}`;
            const open = openKey === key;
            const counts = topicSegments(unit);
            return (
              <li key={key} className="rounded-2xl border border-line bg-canvas p-4">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenKey(open ? null : key)}
                  className="flex w-full cursor-pointer items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[15px] leading-6 font-semibold text-ink">{displayTitle(unit.unit)}</span>
                    <span className="mt-1 block text-[13px] leading-5 tabular-nums text-muted">
                      {unit.started}/{unit.total} topics
                    </span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden
                    className={`mt-1 shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
                <div className="mt-3">
                  <SegmentBar
                    counts={counts}
                    label={`${unit.unit}: ${counts.mastered} mastered, ${counts.progress} in progress, ${counts.review} need review, ${counts.fresh} not started`}
                  />
                </div>
                <div className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    {open && (
                      <ul className="mt-3 border-t border-line pt-2">
                        {unit.topics.map((topic) => (
                          <li key={topic.concept_id + topic.topic}>
                            <Link
                              href={`/study/${encodeURIComponent(topic.concept_id)}`}
                              title={topic.tutor_taught ? "No textbook section, taught directly by the tutor" : undefined}
                              className="flex min-h-11 items-center justify-between gap-3 text-[15px] leading-6 text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                              <span className="min-w-0 flex-1">{displayTitle(topic.topic)}</span>
                              <StatusPill status={TOPIC_STATUS[topic.status]} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function CoverageSummary({ overview }: { overview: StudyOverview }) {
  const stats = calculateSyllabusStats(overview.syllabus);
  const groups = useMemo(() => groupSyllabusBySubject(overview.syllabus), [overview.syllabus]);
  const [syllabusOpen, setSyllabusOpen] = useState(false);

  return (
    <>
      <section id="progress" className="scroll-mt-28">
        <h2 className="mb-3 text-xl leading-7 font-semibold text-ink">Progress</h2>
      <div className="rounded-2xl border border-line bg-surface p-5  sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <StatRing
            percent={stats.startedPct}
            color="var(--text-main)"
            caption="Topics started"
            label={`${stats.totalStarted} / ${stats.totalTopics}`}
          />
          <p className="text-[15px] leading-6 text-ink-2">
            <span className="font-semibold text-ink tabular-nums">{stats.totalStarted}</span>
            <span className="text-muted"> / {stats.totalTopics} topics started</span>
            <span className="mt-1 block text-[13px] leading-5 text-muted">{stats.totalMastered} mastered</span>
          </p>
          <ul className="grid gap-4 sm:grid-cols-3">
            {groups.map((group) => {
              const total = group.units.reduce((sum, unit) => sum + unit.total, 0);
              const started = group.units.reduce((sum, unit) => sum + unit.started, 0);
              const percent = total > 0 ? Math.round((started / total) * 100) : 0;
              return (
                <li key={group.subject}>
                  <StatRing
                    percent={percent}
                    color={subjectVar(group.subject)}
                    caption={group.subject}
                    label={`${started} / ${total}`}
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {overview.coverage.length > 0 && (
          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-[15px] leading-6 font-semibold text-ink">Units in progress</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {overview.coverage.map((chapter) => (
                <UnitProgressCard key={chapter.chapter_id} chapter={chapter} />
              ))}
            </ul>
          </div>
        )}
      </div>
      </section>

      <section id="syllabus" className="scroll-mt-28">
        <h2 className="mb-3 text-xl leading-7 font-semibold text-ink">Browse syllabus</h2>
      <div className="rounded-2xl border border-line bg-surface p-5  sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-[15px] leading-6 text-muted">
            {groups.length} subjects, {overview.syllabus.length} units. Open this to see what you have covered and what is still ahead.
          </p>
          <button
            type="button"
            aria-expanded={syllabusOpen}
            aria-controls="syllabus-browser"
            onClick={() => setSyllabusOpen((value) => !value)}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-on transition-colors duration-150 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {syllabusOpen ? "Close syllabus" : "Open syllabus"}
          </button>
        </div>
        {syllabusOpen && (
          <div id="syllabus-browser">
            <SyllabusBrowser units={overview.syllabus} />
          </div>
        )}
      </div>
      </section>
    </>
  );
}
