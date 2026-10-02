"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import StudyHistory from "@/components/study-room/StudyHistory";
import {
  fetchStudyOverview,
  type OverviewConcept,
  type OverviewGroup,
  type StudyOverview,
  type UpNextItem,
} from "@/lib/api/study";

// Physics only: the tutor's corpus deliberately excludes chemistry and maths.
const SUGGESTIONS = ["LC oscillations", "Projectile motion", "Torque", "Gauss's law", "First law of thermodynamics", "Doppler effect"];

function conceptHref(c: { concept_id: string; study_session_id?: string | null }) {
  const base = `/study/${encodeURIComponent(c.concept_id)}`;
  return c.study_session_id ? `${base}?session=${c.study_session_id}` : base;
}

const pct = (v?: number | null) => (v == null ? null : `${Math.round(v * 100)}%`);

// ── Search ────────────────────────────────────────────────────────────────────

function TopicSearch({ initialMode }: { initialMode: "learn" | "practice" }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"learn" | "practice">(initialMode);
  const go = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/study/${encodeURIComponent(trimmed)}${mode === "practice" ? "?mode=practice" : ""}`);
  };
  return (
    <div className="flex flex-col gap-3">
    <div className="flex w-fit rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="How do you want to study?">
      {([
        { key: "learn", label: "Learn a topic", sub: "lesson → examples → questions" },
        { key: "practice", label: "Practise questions", sub: "skip the theory" },
      ] as const).map((m) => (
        <button
          key={m.key}
          type="button"
          role="radio"
          aria-checked={mode === m.key}
          onClick={() => setMode(m.key)}
          className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-left transition-colors ${
            mode === m.key ? "bg-accent-soft text-ink" : "text-ink-2 hover:text-ink"
          }`}
        >
          <span className="block text-sm font-semibold">{m.label}</span>
          <span className="block text-[11px] text-muted">{m.sub}</span>
        </button>
      ))}
    </div>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(topic);
      }}
      className="w-full"
    >
      <label htmlFor="study-topic" className="sr-only">
        Topic
      </label>
      <div className="relative flex items-center">
        <input
          id="study-topic"
          aria-label="Topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={mode === "practice" ? "Practise any JEE Physics topic — e.g. projectile motion" : "Study any JEE Physics topic — e.g. LC oscillations"}
          className="h-12 w-full rounded-xl border border-line bg-surface pl-4 pr-14 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
        />
        <button
          type="submit"
          disabled={!topic.trim()}
          aria-label="Open study room"
          className="absolute right-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-accent text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs text-ink-2 transition-colors hover:border-accent hover:text-ink"
          >
            {s}
          </button>
        ))}
      </div>
    </form>
    </div>
  );
}

// ── Up next ───────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<UpNextItem["kind"], { tag: string; cta: string }> = {
  review: { tag: "Review", cta: "Start review" },
  resume: { tag: "Continue", cta: "Resume" },
  next: { tag: "Up next", cta: "Start" },
  start: { tag: "Start here", cta: "Start" },
};

function UpNext({ items }: { items: UpNextItem[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section aria-labelledby="up-next-title">
      <h2 id="up-next-title" className="text-[11px] font-bold uppercase tracking-widest text-muted">
        What to study next
      </h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Link
          href={conceptHref(first)}
          className="group flex flex-col justify-between gap-4 rounded-2xl border border-accent/40 bg-accent-soft/40 p-5 transition-colors hover:border-accent"
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-accent">{KIND_LABEL[first.kind].tag}</span>
            <p className="mt-1.5 font-display text-2xl font-semibold text-ink first-letter:uppercase">{first.name}</p>
            <p className="text-xs text-muted">{first.chapter}</p>
            <p className="mt-3 text-sm text-ink-2">{first.reason}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors group-hover:bg-accent-hover">
            {KIND_LABEL[first.kind].cta} →
          </span>
        </Link>
        {rest.length > 0 && (
          <div className="flex flex-col gap-3">
            {rest.map((item) => (
              <Link
                key={item.concept_id}
                href={conceptHref(item)}
                className="flex flex-1 flex-col justify-center rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-accent"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{KIND_LABEL[item.kind].tag}</span>
                <span className="mt-0.5 text-sm font-semibold text-ink first-letter:uppercase">{item.name}</span>
                <span className="mt-0.5 text-xs text-muted">{item.reason}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── The three tables ──────────────────────────────────────────────────────────

function ConceptRow({ c, detail }: { c: OverviewConcept; detail: string | null }) {
  return (
    <li className="group flex items-center gap-1 rounded-lg transition-colors hover:bg-hover">
      <Link href={conceptHref(c)} className="flex min-w-0 flex-1 items-baseline justify-between gap-3 px-2 py-1.5">
        <span className="truncate text-sm text-ink first-letter:uppercase">{c.name}</span>
        {detail && <span className="shrink-0 text-xs tabular-nums text-muted">{detail}</span>}
      </Link>
      <Link
        href={`/study/${encodeURIComponent(c.concept_id)}?mode=practice`}
        title={`Practise questions on ${c.name}`}
        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-accent opacity-70 transition-opacity hover:bg-accent-soft group-hover:opacity-100"
      >
        Practise
      </Link>
    </li>
  );
}

function Bucket({
  title,
  count,
  groups,
  empty,
  detail,
  accent,
}: {
  title: string;
  count: number;
  groups: OverviewGroup[];
  empty: string;
  detail: (c: OverviewConcept) => string | null;
  accent: string;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-line bg-surface" aria-labelledby={`bucket-${title}`}>
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id={`bucket-${title}`} className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden />
          {title}
        </h2>
        <span className="text-xs tabular-nums text-muted">{count}</span>
      </header>
      {groups.length === 0 ? (
        <p className="px-4 py-5 text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto px-2 py-3">
          {groups.map((g) => (
            <div key={g.chapter}>
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{g.chapter}</p>
              <ul className="mt-1">
                {g.concepts.map((c) => (
                  <ConceptRow key={c.concept_id} c={c} detail={detail(c)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Coverage ──────────────────────────────────────────────────────────────────

// Each status pairs a dot with a word (legend + screen-reader text), never colour alone.
const TOPIC_STATUS = {
  mastered: { label: "Mastered", dot: "bg-success" },
  started: { label: "In progress", dot: "bg-accent" },
  review: { label: "Needs review", dot: "bg-danger" },
  new: { label: "Not started", dot: "bg-line-strong" },
} as const;

function Bar({ started, mastered, total, label }: { started: number; mastered: number; total: number; label: string }) {
  const s = total ? (started / total) * 100 : 0;
  const m = total ? (mastered / total) * 100 : 0;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-hover" role="img" aria-label={label}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent/35" style={{ width: `${s}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${m}%` }} />
    </div>
  );
}

function Coverage({ overview }: { overview: StudyOverview }) {
  return (
    <section aria-labelledby="coverage-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="coverage-title" className="text-[11px] font-bold uppercase tracking-widest text-muted">
          Still to cover
        </h2>
        <span className="text-[11px] text-muted">bar: dark = mastered · light = started</span>
      </div>
      {overview.coverage.length > 0 && (
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {overview.coverage.map((c) => (
            <div key={c.chapter_id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink">{c.chapter}</p>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {c.started}/{c.total}
                </span>
              </div>
              <div className="mt-2">
                <Bar started={c.started} mastered={c.mastered} total={c.total} label={`${c.chapter}: ${c.started} of ${c.total} started, ${c.mastered} mastered`} />
              </div>
              {c.next.length > 0 ? (
                <>
                  <p className="mt-3 text-xs text-muted">Next in this unit (syllabus order)</p>
                  <ol className="mt-1.5 flex flex-wrap gap-1.5">
                    {c.next.map((n, i) => (
                      <li key={n.concept_id}>
                        <Link
                          href={`/study/${encodeURIComponent(n.concept_id)}`}
                          className={`inline-block rounded-full border px-2.5 py-1 text-xs transition-colors first-letter:uppercase ${
                            i === 0 ? "border-accent/50 font-semibold text-ink" : "border-line text-ink-2 hover:border-accent"
                          }`}
                        >
                          {n.name}
                        </Link>
                      </li>
                    ))}
                    {c.remaining > c.next.length && <li className="self-center text-xs text-muted">+{c.remaining - c.next.length} more</li>}
                  </ol>
                </>
              ) : (
                <p className="mt-3 text-xs text-success">Every topic in this unit started.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <details className="group mt-3 rounded-2xl border border-line bg-surface">
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink">
          Full JEE Main syllabus
          <span className="text-xs font-normal text-muted">
            {overview.syllabus.reduce((a, u) => a + u.started, 0)} of {overview.syllabus.reduce((a, u) => a + u.total, 0)} topics started ·{" "}
            {overview.syllabus.length} units
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4">
          <p className="mb-4 text-xs text-muted">
            Unit and topic list follows the NTA JEE Main 2026-27 syllabus as published by ALLEN. Topics marked{" "}
            <span className="font-semibold text-ink-2">tutor-taught</span> have no textbook section in your course
            material — the tutor teaches them directly.
          </p>
          <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            {overview.syllabus.map((u, i) => (
              <section key={u.unit} aria-label={u.unit}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-2">
                    <span className="mr-1.5 tabular-nums text-muted">{i + 1}.</span>
                    {u.unit}
                  </p>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">
                    {u.started}/{u.total}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar started={u.started} mastered={u.mastered} total={u.total} label={`${u.unit}: ${u.started} of ${u.total} topics started, ${u.mastered} mastered`} />
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {u.topics.map((t) => (
                    <li key={t.concept_id + t.topic}>
                      <Link
                        href={`/study/${encodeURIComponent(t.concept_id)}`}
                        title={t.tutor_taught ? "No textbook section — taught directly by the tutor" : undefined}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors hover:border-accent ${
                          t.status === "new" ? "border-line text-ink-2" : "border-accent/40 text-ink"
                        }`}
                      >
                        <span className="sr-only">{TOPIC_STATUS[t.status].label}: </span>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TOPIC_STATUS[t.status].dot}`} aria-hidden />
                        {t.topic}
                        {t.tutor_taught && <span className="text-[10px] text-muted">· tutor-taught</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
            {(["mastered", "started", "review", "new"] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${TOPIC_STATUS[k].dot}`} aria-hidden />
                {TOPIC_STATUS[k].label}
              </span>
            ))}
          </p>
        </div>
      </details>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Could not load your study plan."));
    return () => {
      live = false;
    };
  }, []);

  return (
    <main className="flex-1 overflow-y-auto px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="shrink-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Study room</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">What are we learning today?</h1>
          </div>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5M12 7v5l3 2" />
            </svg>
            History
          </button>
        </header>

        <TopicSearch initialMode={initialMode} />

        {error ? (
          <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
        ) : !overview ? (
          <div className="flex items-center gap-3 py-10 text-sm text-muted" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none" />
            Working out what&apos;s next for you…
          </div>
        ) : (
          <>
            <UpNext items={overview.up_next} />

            <section aria-label="Where you stand" className="grid gap-4 lg:grid-cols-3">
              <Bucket
                title="Needs review"
                count={overview.counts.needs_review}
                groups={overview.needs_review}
                empty="Nothing to review. Topics come here when a review is due or a score slips."
                detail={(c) => (c.overdue ? "due now" : c.reason ?? null)}
                accent="bg-danger"
              />
              <Bucket
                title="In progress"
                count={overview.counts.in_progress}
                groups={overview.in_progress}
                empty="Nothing in progress. Pick a topic above to start."
                detail={(c) => (c.phase ? `in ${c.phase}` : pct(c.proficiency))}
                accent="bg-warning"
              />
              <Bucket
                title="Mastered"
                count={overview.counts.mastered}
                groups={overview.mastered}
                empty="Nothing mastered yet — finish a study session to get here."
                detail={(c) => pct(c.proficiency)}
                accent="bg-success"
              />
            </section>

            <Coverage overview={overview} />
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
        <Suspense fallback={null}>
          <StudyHome />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
