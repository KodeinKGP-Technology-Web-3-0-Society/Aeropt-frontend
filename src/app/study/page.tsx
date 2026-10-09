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

const MODES = [
  { key: "learn", label: "Learn a topic", hint: "A short lesson, worked examples, then questions." },
  { key: "practice", label: "Practise questions", hint: "Straight to questions, no theory." },
] as const;

function TopicSearch({ initialMode }: { initialMode: "learn" | "practice" }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"learn" | "practice">(initialMode);
  const go = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/study/${encodeURIComponent(trimmed)}${mode === "practice" ? "?mode=practice" : ""}`);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-6 border-b border-line" role="radiogroup" aria-label="How do you want to study?">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            onClick={() => setMode(m.key)}
            className={`-mb-px cursor-pointer border-b-2 pb-2.5 text-sm font-medium transition-colors ${
              mode === m.key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {m.label}
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
            placeholder={mode === "practice" ? "Practise any JEE Physics topic, e.g. projectile motion" : "Study any JEE Physics topic, e.g. LC oscillations"}
            className="h-12 w-full rounded-lg border border-line bg-surface pl-4 pr-14 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
          />
          <button
            type="submit"
            disabled={!topic.trim()}
            aria-label="Open study room"
            className="absolute right-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md bg-accent text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted">{MODES.find((m) => m.key === mode)?.hint} Try</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => go(s)}
              className="cursor-pointer text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
            >
              {s}
            </button>
          ))}
        </p>
      </form>
    </div>
  );
}

// ── Up next ───────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<UpNextItem["kind"], { tag: string; cta: string }> = {
  review: { tag: "Review due", cta: "Start review" },
  resume: { tag: "Continue where you left off", cta: "Resume" },
  next: { tag: "Up next", cta: "Start" },
  start: { tag: "Start here", cta: "Start" },
};

function UpNext({ items }: { items: UpNextItem[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section aria-label="What to study next" className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Link href={conceptHref(first)} className="group block">
        <p className={`text-sm font-medium ${first.kind === "review" ? "text-danger" : "text-accent"}`}>{KIND_LABEL[first.kind].tag}</p>
        <p className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-ink first-letter:uppercase">{first.name}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
          <span className="text-muted">{first.chapter}.</span> {first.reason}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors group-hover:bg-accent-hover">
          {KIND_LABEL[first.kind].cta} →
        </span>
      </Link>
      {rest.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted">After that</h2>
          <ul className="mt-1 divide-y divide-line border-t border-line">
            {rest.map((item) => (
              <li key={item.concept_id}>
                <Link href={conceptHref(item)} className="group block py-3">
                  <span className="block text-sm font-medium text-ink first-letter:uppercase group-hover:text-accent">{item.name}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-muted">
                    {KIND_LABEL[item.kind].tag}. {item.reason}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ── The three lists ───────────────────────────────────────────────────────────

function ConceptRow({ c, detail }: { c: OverviewConcept; detail: string | null }) {
  return (
    <li className="group -mx-2 flex items-center gap-1 rounded-md transition-colors hover:bg-hover">
      <Link href={conceptHref(c)} className="flex min-w-0 flex-1 items-baseline justify-between gap-3 px-2 py-1.5">
        <span className="truncate text-sm text-ink first-letter:uppercase">{c.name}</span>
        {detail && <span className="shrink-0 text-xs tabular-nums text-muted">{detail}</span>}
      </Link>
      <Link
        href={`/study/${encodeURIComponent(c.concept_id)}?mode=practice`}
        title={`Practise questions on ${c.name}`}
        className="shrink-0 rounded px-2 py-1 text-xs font-medium text-accent opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        Practise
      </Link>
    </li>
  );
}

const BUCKET_LIMIT = 8;

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
  const [showAll, setShowAll] = useState(false);
  const total = groups.reduce((a, g) => a + g.concepts.length, 0);
  // Cut the list at BUCKET_LIMIT concepts across chapters, keeping chapter headings.
  const limit = showAll ? total : BUCKET_LIMIT;
  const before = groups.map((_, i) => groups.slice(0, i).reduce((a, g) => a + g.concepts.length, 0));
  const shown = groups
    .map((g, i) => ({ ...g, concepts: g.concepts.slice(0, Math.max(0, limit - before[i])) }))
    .filter((g) => g.concepts.length);
  const id = `bucket-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-2 border-b border-line pb-2.5 text-base font-semibold text-ink">
        <span className={`h-2 w-2 rounded-full ${accent}`} aria-hidden />
        {title}
        <span className="text-sm font-normal tabular-nums text-muted">{count}</span>
      </h2>
      {groups.length === 0 ? (
        <p className="pt-3 text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          {shown.map((g) => (
            <div key={g.chapter}>
              <p className="text-xs font-medium text-muted">{g.chapter}</p>
              <ul className="mt-0.5">
                {g.concepts.map((c) => (
                  <ConceptRow key={c.concept_id} c={c} detail={detail(c)} />
                ))}
              </ul>
            </div>
          ))}
          {total > BUCKET_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-fit cursor-pointer text-sm text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-accent"
            >
              {showAll ? "Show fewer" : `Show all ${total}`}
            </button>
          )}
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
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-hover" role="img" aria-label={label}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent/35" style={{ width: `${s}%` }} />
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${m}%` }} />
    </div>
  );
}

function Coverage({ overview }: { overview: StudyOverview }) {
  return (
    <section aria-labelledby="coverage-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="coverage-title" className="text-base font-semibold text-ink">
          Still to cover
        </h2>
        <span className="text-xs text-muted">Bar: dark is mastered, light is started</span>
      </div>
      {overview.coverage.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {overview.coverage.map((c) => (
            <li key={c.chapter_id} className="grid gap-x-10 gap-y-2 py-4 md:grid-cols-[16rem_minmax(0,1fr)]">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{c.chapter}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {c.started}/{c.total}
                  </span>
                </div>
                <div className="mt-2">
                  <Bar started={c.started} mastered={c.mastered} total={c.total} label={`${c.chapter}: ${c.started} of ${c.total} started, ${c.mastered} mastered`} />
                </div>
              </div>
              {c.next.length > 0 ? (
                <ol className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm" aria-label={`Next in ${c.chapter}, in syllabus order`}>
                  <li className="text-muted">Next</li>
                  {c.next.map((n, i) => (
                    <li key={n.concept_id}>
                      <Link
                        href={`/study/${encodeURIComponent(n.concept_id)}`}
                        className={`inline-block transition-colors first-letter:uppercase hover:text-accent ${i === 0 ? "font-medium text-ink" : "text-ink-2"}`}
                      >
                        {n.name}
                      </Link>
                    </li>
                  ))}
                  {c.remaining > c.next.length && <li className="text-xs text-muted">+{c.remaining - c.next.length} more</li>}
                </ol>
              ) : (
                <p className="text-sm text-success">Every topic in this unit started.</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <details className="group border-y border-line">
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-muted transition-transform group-open:rotate-90">
              <path d="m9 6 6 6-6 6" />
            </svg>
            Full JEE Main syllabus
          </span>
          <span className="text-xs font-normal text-muted">
            {overview.syllabus.reduce((a, u) => a + u.started, 0)} of {overview.syllabus.reduce((a, u) => a + u.total, 0)} topics started,{" "}
            {overview.syllabus.length} units
          </span>
        </summary>
        <div className="pb-6">
          <p className="mb-6 max-w-3xl text-xs leading-relaxed text-muted">
            Unit and topic list follows the NTA JEE Main 2026-27 syllabus as published by ALLEN. Topics marked{" "}
            <span className="font-semibold text-ink-2">tutor-taught</span> have no textbook section in your course
            material, so the tutor teaches them directly.
          </p>
          <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
            {overview.syllabus.map((u, i) => (
              <section key={u.unit} aria-label={u.unit}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    <span className="mr-2 tabular-nums text-muted">{i + 1}</span>
                    {u.unit}
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {u.started}/{u.total}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar started={u.started} mastered={u.mastered} total={u.total} label={`${u.unit}: ${u.started} of ${u.total} topics started, ${u.mastered} mastered`} />
                </div>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {u.topics.map((t) => (
                    <li key={t.concept_id + t.topic}>
                      <Link
                        href={`/study/${encodeURIComponent(t.concept_id)}`}
                        title={t.tutor_taught ? "No textbook section, taught directly by the tutor" : undefined}
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
          <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14">
        <header className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-ink">What are we learning today?</h1>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5M12 7v5l3 2" />
            </svg>
            Past sessions
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

            <section aria-label="Where you stand" className="grid gap-x-12 gap-y-10 lg:grid-cols-3">
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
                empty="Nothing mastered yet. Finish a study session to get here."
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
