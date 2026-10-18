"use client";

import Link from "next/link";
import type { StudyOverview } from "@/lib/api/study";
import { calculateSyllabusStats } from "@/lib/studyOverview";

interface CoverageSummaryProps {
  overview: StudyOverview;
}

const TOPIC_STATUS = {
  mastered: { label: "Mastered", dot: "bg-success" },
  started: { label: "In progress", dot: "bg-accent" },
  review: { label: "Needs review", dot: "bg-danger" },
  new: { label: "Not started", dot: "bg-line-strong" },
} as const;

function ThinBar({
  started,
  mastered,
  total,
  label,
}: {
  started: number;
  mastered: number;
  total: number;
  label: string;
}) {
  const s = total ? Math.min(100, (started / total) * 100) : 0;
  const m = total ? Math.min(100, (mastered / total) * 100) : 0;

  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-hover"
      role="img"
      aria-label={label}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent/35 transition-all"
        style={{ width: `${s}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all"
        style={{ width: `${m}%` }}
      />
    </div>
  );
}

export default function CoverageSummary({ overview }: CoverageSummaryProps) {
  const stats = calculateSyllabusStats(overview.syllabus);

  return (
    <section aria-labelledby="coverage-heading" className="rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-8">
      {/* Overview Metric Header */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="coverage-heading" className="text-base sm:text-lg font-semibold text-ink">
            JEE syllabus coverage
          </h2>
          <span className="text-xs sm:text-sm tabular-nums text-muted font-medium">
            {stats.totalStarted} of {stats.totalTopics} topics started ({stats.startedPct}%) ·{" "}
            {stats.totalMastered} mastered
          </span>
        </div>

        <ThinBar
          started={stats.totalStarted}
          mastered={stats.totalMastered}
          total={stats.totalTopics}
          label={`Overall syllabus: ${stats.totalStarted} of ${stats.totalTopics} topics started, ${stats.totalMastered} mastered`}
        />
      </div>

      {/* Active Chapters/Units Strip (if any) */}
      {overview.coverage.length > 0 && (
        <div className="mt-6 border-t border-line/60 pt-5">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted">
            Recent units in progress
          </h3>
          <ul className="mt-3 divide-y divide-line/40">
            {overview.coverage.map((c) => (
              <li key={c.chapter_id} className="grid gap-3 py-3.5 md:grid-cols-[18rem_minmax(0,1fr)]">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-xs sm:text-sm font-semibold text-ink">{c.chapter}</p>
                    <span className="shrink-0 text-xs sm:text-sm tabular-nums text-muted">
                      {c.started}/{c.total}
                    </span>
                  </div>
                  <div className="mt-2">
                    <ThinBar
                      started={c.started}
                      mastered={c.mastered}
                      total={c.total}
                      label={`${c.chapter}: ${c.started} of ${c.total} started, ${c.mastered} mastered`}
                    />
                  </div>
                </div>

                {c.next.length > 0 ? (
                  <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5 text-xs sm:text-sm">
                    <span className="text-muted">Next up:</span>
                    {c.next.map((n, i) => (
                      <Link
                        key={n.concept_id}
                        href={`/study/${encodeURIComponent(n.concept_id)}`}
                        className={`transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          i === 0 ? "font-semibold text-ink" : "text-ink-2"
                        }`}
                      >
                        {n.name}
                      </Link>
                    ))}
                    {c.remaining > c.next.length && (
                      <span className="text-muted">+{c.remaining - c.next.length} more</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-success">
                    All topics in this unit started.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable Full Syllabus */}
      <details className="group mt-5 border-t border-line/60">
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 py-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-muted transition-transform group-open:rotate-90"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            See full JEE Main syllabus ({overview.syllabus.length} units)
          </span>
          <span className="text-xs font-normal text-muted">
            NTA JEE Main 2026-27
          </span>
        </summary>

        <div className="pt-4 pb-2">
          <p className="mb-5 text-xs sm:text-sm leading-relaxed text-muted">
            Unit and topic list follows the official NTA JEE Main 2026-27 syllabus.
          </p>

          <div className="grid gap-x-10 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
            {overview.syllabus.map((u, i) => (
              <div key={u.unit} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs sm:text-sm font-semibold text-ink">
                    <span className="mr-1.5 tabular-nums text-muted">{i + 1}.</span>
                    {u.unit}
                  </p>
                  <span className="shrink-0 text-xs sm:text-sm tabular-nums text-muted">
                    {u.started}/{u.total}
                  </span>
                </div>
                <ThinBar
                  started={u.started}
                  mastered={u.mastered}
                  total={u.total}
                  label={`${u.unit}: ${u.started} of ${u.total} started, ${u.mastered} mastered`}
                />
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {u.topics.map((t) => (
                    <li key={t.concept_id + t.topic}>
                      <Link
                        href={`/study/${encodeURIComponent(t.concept_id)}`}
                        title={
                          t.tutor_taught
                            ? "No textbook section, taught directly by tutor"
                            : undefined
                        }
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-accent ${
                          t.status === "new"
                            ? "border-line text-ink-2"
                            : "border-accent/40 text-ink"
                        }`}
                      >
                        <span className="sr-only">{TOPIC_STATUS[t.status].label}: </span>
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${TOPIC_STATUS[t.status].dot}`}
                          aria-hidden
                        />
                        <span className="truncate max-w-[160px] sm:max-w-none">{t.topic}</span>
                        {t.tutor_taught && (
                          <span className="text-[10px] text-muted">· tutor</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Status legend */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line/40 pt-4 text-xs text-muted">
            {(["mastered", "started", "review", "new"] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${TOPIC_STATUS[k].dot}`} aria-hidden />
                {TOPIC_STATUS[k].label}
              </span>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
