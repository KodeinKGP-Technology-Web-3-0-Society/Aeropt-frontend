"use client";

import Link from "next/link";
import type { SyllabusUnit, UpNextItem } from "@/lib/api/study";
import { conceptHref, displayTitle, formatRelativeTime, KIND_LABEL, subjectForLabel, type TodaySetPick } from "@/lib/studyOverview";
import { subjectInk, subjectVar, SubjectMark } from "./studyChrome";

const STAGES = ["Learn", "Examples", "Practice"] as const;

function stageIndex(phase?: string | null): number {
  if (phase === "examples") return 1;
  if (phase === "practice" || phase === "evaluation" || phase === "completed") return 2;
  return 0;
}

const primaryClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-6 text-[15px] font-semibold text-accent-on transition-colors duration-150 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export default function ContinueCard({
  items,
  syllabus,
  today = null,
  todayPending = false,
}: {
  items: UpNextItem[];
  syllabus: SyllabusUnit[];
  /** First unfinished item from today's plan. Null hides the action. */
  today?: TodaySetPick | null;
  /** Plan still loading: keep the resume hero, and don't claim the queue is empty. */
  todayPending?: boolean;
}) {
  const queued = items ?? [];
  if (queued.length === 0 && !today) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-[15px] leading-6 text-muted ">
        {todayPending
          ? "Checking today’s plan…"
          : "Nothing queued yet. Search for a topic below, or open the syllabus and pick a chapter."}
      </div>
    );
  }

  if (queued.length === 0 && today) {
    const subject = today.subject || null;
    const color = subjectVar(subject);
    const ink = subjectInk(subject);
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {subject && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] leading-5 font-medium"
                  style={{ color: ink, background: `color-mix(in srgb, ${color} 14%, var(--bg-surface))` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                  {subject}
                </span>
              )}
              <span className="text-[13px] leading-5 font-medium text-muted">Today’s set</span>
            </div>
            <h3 className="mt-3 text-[28px] leading-9 font-semibold tracking-tight text-ink sm:text-[32px] sm:leading-10">
              <Link href={today.href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {displayTitle(today.topic)}
              </Link>
            </h3>
            {today.unit && <p className="mt-1 text-[15px] leading-6 text-ink-2">{displayTitle(today.unit)}</p>}
          </div>
          <Link href={today.href} className={primaryClass}>
            Start today’s set
          </Link>
        </div>
      </div>
    );
  }

  const matched = today ? queued.find((item) => item.concept_id === today.conceptId) : undefined;
  if (today && !matched) {
    const subject = today.subject || null;
    const color = subjectVar(subject);
    const ink = subjectInk(subject);
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {subject && (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] leading-5 font-medium"
                  style={{ color: ink, background: `color-mix(in srgb, ${color} 14%, var(--bg-surface))` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                  {subject}
                </span>
              )}
              <span className="text-[13px] leading-5 font-medium text-muted">Today’s set</span>
            </div>
            <h3 className="mt-3 text-[28px] leading-9 font-semibold tracking-tight text-ink sm:text-[32px] sm:leading-10">
              <Link href={today.href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {displayTitle(today.topic)}
              </Link>
            </h3>
            {today.unit && <p className="mt-1 text-[15px] leading-6 text-ink-2">{displayTitle(today.unit)}</p>}
          </div>
          <Link href={today.href} className={primaryClass}>
            Start today’s set
          </Link>
        </div>
        <Queued items={queued} syllabus={syllabus} />
      </div>
    );
  }

  const first = matched ?? queued[0];
  const rest = queued.filter((item) => item.concept_id !== first.concept_id);
  const kindMeta = KIND_LABEL[first.kind] || { tag: "Up next", cta: "Start" };
  const href = today ? today.href : conceptHref(first);
  const cta = today ? "Start today’s set" : kindMeta.cta;
  const subject = subjectForLabel(first.chapter, syllabus) || subjectForLabel(first.name, syllabus);
  const color = subjectVar(subject);
  const ink = subjectInk(subject);
  const stage = stageIndex(first.phase);
  const when = formatRelativeTime(first.last_practised);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5  sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {subject && (
              <span
                className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[13px] leading-5 font-medium"
                style={{ color: ink, background: `color-mix(in srgb, ${color} 14%, var(--bg-surface))` }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                {subject}
              </span>
            )}
            <span className="text-[13px] leading-5 font-medium text-muted">{kindMeta.tag}</span>
          </div>
          <h3 className="mt-3 text-[28px] leading-9 font-semibold tracking-tight text-ink sm:text-[32px] sm:leading-10">
            <Link href={href} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {displayTitle(first.name)}
            </Link>
          </h3>
          <p className="mt-1 text-[15px] leading-6 text-ink-2">{displayTitle(first.chapter)}</p>
          <ol className="mt-4 flex flex-wrap items-center gap-2" aria-label="Lesson stages">
            {STAGES.map((label, index) => {
              const current = index === stage;
              const done = index < stage;
              return (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[13px] leading-5 font-medium ${
                      current ? "bg-accent text-accent-on" : done ? "bg-hover text-ink" : "text-muted"
                    }`}
                    aria-current={current ? "step" : undefined}
                  >
                    {index + 1} {label}
                  </span>
                  {index < STAGES.length - 1 && <span className="text-muted" aria-hidden>→</span>}
                </li>
              );
            })}
          </ol>
          {when && (
            <p className="mt-3 text-[13px] leading-5 text-muted">
              Last studied {when === "Today" ? "today" : when === "Yesterday" ? "yesterday" : when}
            </p>
          )}
        </div>
        <Link href={href} className={primaryClass}>
          {cta}
        </Link>
      </div>

      <Queued items={rest} syllabus={syllabus} />
    </div>
  );
}

function Queued({ items, syllabus }: { items: UpNextItem[]; syllabus: SyllabusUnit[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-6 border-t border-line pt-4">
      <p className="text-[13px] leading-5 font-medium text-muted">Also queued</p>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const itemSubject = subjectForLabel(item.chapter, syllabus) || subjectForLabel(item.name, syllabus);
          return (
            <li key={item.concept_id}>
              <Link
                href={conceptHref(item)}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 py-2 transition-colors duration-150 hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <SubjectMark subject={itemSubject} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] leading-6 font-medium text-ink">{displayTitle(item.name)}</span>
                  <span className="block truncate text-[13px] leading-5 text-muted">{displayTitle(item.chapter)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
