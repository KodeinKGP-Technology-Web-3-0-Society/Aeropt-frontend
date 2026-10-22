"use client";

import Link from "next/link";
import { studyHref } from "@/lib/routes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppPage } from "@/components/AppPage";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import {
  fetchProgressCached,
  type ConceptStatus,
  type ProgressChapter,
  type ProgressConcept,
  type ProgressReport,
} from "@/lib/api/progress";
import { unfixedPracticeTarget } from "@/lib/studyOverview";
import ActivityChart from "./ActivityChart";

// Status always carries its word: teal accent and "mastered" green are too close
// to tell apart by colour alone (ΔE 7.8, measured), so colour is never the cue.
const STATUS: Record<ConceptStatus, { label: string; tone: string }> = {
  mastered: { label: "Mastered", tone: "bg-success/12 text-success" },
  strong: { label: "Strong", tone: "bg-hover text-ink" },
  building: { label: "Building", tone: "bg-warning/15 text-ink-2" },
  weak: { label: "Weak", tone: "bg-danger/10 text-danger" },
  new: { label: "New", tone: "bg-hover text-muted" },
};

const ERROR_LABEL: Record<string, string> = {
  conceptual: "Conceptual",
  procedural: "Method",
  calculation: "Calculation",
  misread: "Misread",
  unclassified: "Unclassified",
};

const pct = (v: number | null | undefined) => (v == null ? "–" : `${Math.round(v * 100)}%`);

function ago(iso: string | null | undefined): string {
  if (!iso) return "–";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}


function StatTile({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: { text: string; good: boolean } | null }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
        {delta && <span className={`font-semibold ${delta.good ? "text-success" : "text-danger"}`}>{delta.text}</span>}
        {sub && <span>{sub}</span>}
      </p>
    </div>
  );
}

function ProficiencyBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-hover" role="img" aria-label={label}>
      <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max(2, Math.round(value * 100))}%` }} />
      {/* mastery line at 80%: position, not colour, says "mastered" */}
      <div className="absolute -top-0.5 h-3 w-px bg-ink-2/50" style={{ left: "80%" }} aria-hidden />
    </div>
  );
}

function Chapters({ chapters }: { chapters: ProgressChapter[] }) {
  if (!chapters.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="chapters-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="chapters-title" className="text-sm font-semibold text-ink">
          Mastery by chapter
        </h2>
        <span className="text-[11px] text-muted">line marks mastery (80%)</span>
      </div>
      <ul className="mt-4 flex flex-col gap-3.5">
        {chapters.map((c) => (
          <li key={c.chapter}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium text-ink">{c.chapter}</span>
              <span className="shrink-0 tabular-nums text-ink-2">{pct(c.proficiency)}</span>
            </div>
            <ProficiencyBar value={c.proficiency} label={`${c.chapter}: ${pct(c.proficiency)} proficiency`} />
            <p className="mt-1 text-[11px] text-muted">
              {c.concepts} concept{c.concepts === 1 ? "" : "s"} · {c.attempts} question{c.attempts === 1 ? "" : "s"}
              {c.accuracy != null ? ` · ${pct(c.accuracy)} right` : ""}
              {c.mastered ? ` · ${c.mastered} mastered` : ""}
              {c.weak ? ` · ${c.weak} weak` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const FILTERS: { key: "all" | ConceptStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "weak", label: "Weak" },
  { key: "building", label: "Building" },
  { key: "strong", label: "Strong" },
  { key: "mastered", label: "Mastered" },
];

function Concepts({ concepts }: { concepts: ProgressConcept[] }) {
  const [filter, setFilter] = useState<"all" | ConceptStatus>("all");
  const shown = filter === "all" ? concepts : concepts.filter((c) => c.status === filter);
  if (!concepts.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface" aria-labelledby="concepts-title">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
        <h2 id="concepts-title" className="text-sm font-semibold text-ink">
          Concepts you&apos;ve practised
        </h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => {
            const n = f.key === "all" ? concepts.length : concepts.filter((c) => c.status === f.key).length;
            if (f.key !== "all" && n === 0) return null;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.key ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-ink"
                }`}
              >
                {f.label} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-line">
              <th className="px-5 py-2 font-medium">Concept</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="w-40 px-3 py-2 font-medium">Proficiency</th>
              <th className="px-3 py-2 text-right font-medium">Right</th>
              <th className="px-3 py-2 text-right font-medium">2-week trend</th>
              <th className="px-3 py-2 font-medium">Last practised</th>
              <th className="px-5 py-2" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.concept_id} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5">
                  <span className="block font-medium text-ink first-letter:uppercase">{c.name}</span>
                  <span className="block text-xs text-muted">{c.chapter}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS[c.status].tone}`}>
                    {c.discussed_only ? "Studied" : STATUS[c.status].label}
                  </span>
                  {c.review_due && <span className="ml-1.5 text-[11px] text-ink-2">· review due</span>}
                </td>
                <td className="px-3 py-2.5">
                  {c.attempts ? (
                    <div className="flex items-center gap-2">
                      <ProficiencyBar value={c.proficiency} label={`${pct(c.proficiency)} proficiency`} />
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-ink-2">{pct(c.proficiency)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Not practised yet</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-ink-2">
                  {c.correct}/{c.attempts}
                </td>
                <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                  {c.trend == null || Math.abs(c.trend) < 0.01 ? (
                    <span className="text-muted">–</span>
                  ) : (
                    <span className={c.trend > 0 ? "text-success" : "text-danger"}>
                      {c.trend > 0 ? "▲" : "▼"} {Math.abs(Math.round(c.trend * 100))} pts
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted">{ago(c.last_practised)}</td>
                <td className="px-5 py-2.5 text-right">
                  <Link href={studyHref(c.concept_id)} className="text-xs font-semibold text-ink underline-offset-2 hover:underline">
                    {c.status === "mastered" ? "Revisit" : "Practise"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Mistakes({ report }: { report: ProgressReport }) {
  const { by_type, total_wrong, notebook } = report.mistakes;
  const [showFixed, setShowFixed] = useState(false);
  if (!total_wrong) return null;
  const types = Object.entries(by_type).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...types.map(([, n]) => n));
  const entries = showFixed ? notebook : notebook.filter((m) => !m.fixed);
  const redo = unfixedPracticeTarget(notebook);
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="mistakes-title">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="mistakes-title" className="text-sm font-semibold text-ink">
          Mistake notebook
        </h2>
        <span className="text-xs text-muted">
          {total_wrong} wrong answer{total_wrong === 1 ? "" : "s"} so far
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-2" aria-label="Mistakes by type">
        {types.map(([type, n]) => (
          <li key={type} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3 text-xs">
            <span className="text-ink-2">{ERROR_LABEL[type] ?? type}</span>
            <span className="h-2 rounded-r-[4px] bg-ink" style={{ width: `${Math.max(4, (n / max) * 100)}%` }} aria-hidden />
            <span className="text-right tabular-nums text-ink">{n}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs font-semibold text-ink-2">{showFixed ? "All recent mistakes" : "Still to fix"}</p>
        <div className="flex flex-wrap items-center gap-3">
          {redo && (
            <Link
              href={redo.href}
              className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-[15px] font-semibold text-accent-on transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {redo.label}
            </Link>
          )}
          {notebook.some((m) => m.fixed) && (
            <button type="button" onClick={() => setShowFixed((v) => !v)} className="cursor-pointer text-xs text-muted hover:text-ink">
              {showFixed ? "Hide fixed" : "Show fixed too"}
            </button>
          )}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Every recent mistake has since been answered correctly. Nice.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {entries.slice(0, 8).map((m, i) => (
            <li key={`${m.content_id}-${i}`} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {m.concept_name && <span className="font-semibold text-ink first-letter:uppercase">{m.concept_name}</span>}
                {m.error_type && (
                  <span className="rounded-full bg-hover px-2 py-0.5 font-semibold text-ink-2">{ERROR_LABEL[m.error_type] ?? m.error_type}</span>
                )}
                {m.fixed && <span className="rounded-full bg-success/12 px-2 py-0.5 font-semibold text-success">Fixed since</span>}
                <span className="ml-auto text-muted">{ago(m.when)}</span>
              </div>
              {m.question && (
                <div className="study-notes mt-2 text-sm">
                  <MathErrorBoundary content={m.question}>
                    <MarkdownMath content={m.question.length > 420 ? `${m.question.slice(0, 420)}…` : m.question} />
                  </MathErrorBoundary>
                </div>
              )}
              {m.student_answer && (
                <p className="mt-2 text-xs text-ink-2">
                  <span className="text-muted">You answered: </span>
                  {m.student_answer}
                </p>
              )}
              {m.concept_id && !m.fixed && (
                <Link href={studyHref(m.concept_id)} className="mt-2 inline-block text-xs font-semibold text-ink underline-offset-2 hover:underline">
                  Practise this concept
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Timeline({ report }: { report: ProgressReport }) {
  if (!report.timeline.length) return null;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="text-sm font-semibold text-ink">
        Recent activity
      </h2>
      <ol className="mt-3 flex flex-col">
        {report.timeline.slice(0, 15).map((t, i) => (
          <li key={`${t.when}-${i}`} className="flex gap-3 border-b border-line py-2.5 text-sm last:border-0">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                t.outcome === "wrong" ? "bg-danger" : t.kind === "attempt" || t.outcome === "mastered" ? "bg-success" : "bg-line-strong"
              }`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-ink-2 first-letter:uppercase">
                {t.text}
                {t.count && t.count > 1 ? <span className="text-muted"> · {t.count} messages</span> : null}
                {t.delta_pct ? (
                  <span className={`ml-1.5 text-xs tabular-nums ${t.delta_pct > 0 ? "text-success" : "text-danger"}`}>
                    {t.delta_pct > 0 ? "+" : ""}
                    {t.delta_pct} pts
                  </span>
                ) : null}
              </p>
              {t.detail && <p className="truncate text-xs text-muted">“{t.detail}”</p>}
            </div>
            <span className="shrink-0 text-xs text-muted">{ago(t.when)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ProgressContent() {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    // Retry forces a fresh read; otherwise the cached report (stale-while-revalidate) paints at once.
    fetchProgressCached(reloadKey > 0)
      .then((r) => live && setReport(r))
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Could not load your progress."));
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const o = report?.overview;
  const weekDelta = useMemo(() => {
    if (!o || o.accuracy_7d == null || o.accuracy_prev_7d == null) return null;
    const d = Math.round((o.accuracy_7d - o.accuracy_prev_7d) * 100);
    return d === 0 ? null : { text: `${d > 0 ? "▲" : "▼"} ${Math.abs(d)} pts`, good: d > 0 };
  }, [o]);

  if (error) {
    return (
      <AppPage title="How you're doing">
        <div className="max-w-md rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <button type="button" onClick={retry} className="mt-4 cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on">
            Try again
          </button>
        </div>
      </AppPage>
    );
  }
  if (!report || !o) {
    return (
      <AppPage title="How you're doing" busy>
        <div className="flex flex-col items-center gap-3 py-16" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-ink motion-reduce:animate-none" />
          <p className="text-sm text-muted">Loading your progress…</p>
        </div>
      </AppPage>
    );
  }

  const empty = o.questions_attempted === 0 && report.timeline.length === 0;

  return (
    <AppPage
      title="How you're doing"
      actions={
        <p className="text-sm text-muted">
          {o.last_active ? `Last active ${ago(o.last_active)}` : "No activity yet"} ·{" "}
          <button type="button" onClick={retry} className="cursor-pointer underline-offset-2 hover:text-ink hover:underline">
            Refresh
          </button>
        </p>
      }
    >

      {empty ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Nothing to show yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Every question you answer, topic you study and doubt you ask is recorded here: your accuracy, what&apos;s getting
            stronger, and the mistakes worth another look.
          </p>
          <Link href="/study" className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-on hover:bg-accent-hover">
            Start a study session
          </Link>
        </div>
      ) : (
        <>
          {report.insights.length > 0 && (
            <section aria-label="What to do next" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {report.insights.map((ins, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm"
                >
                  <p className="text-ink-2">{ins.text}</p>
                  {ins.concept_id && ins.action && (
                    <Link href={studyHref(ins.concept_id)} className="text-xs font-semibold text-ink underline-offset-2 hover:underline">
                      {ins.action === "review" ? "Start review" : "Study it"}
                    </Link>
                  )}
                </div>
              ))}
            </section>
          )}

          <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Questions answered"
              value={o.questions_attempted.toLocaleString()}
              sub={`${pct(o.accuracy)} right${o.accuracy_7d != null ? ` · ${pct(o.accuracy_7d)} this week` : ""}`}
              delta={weekDelta}
            />
            <StatTile
              label="Streak"
              value={`${o.streak_days} day${o.streak_days === 1 ? "" : "s"}`}
              sub={o.active_today ? `Best ${o.best_streak_days} · today counts` : `Best ${o.best_streak_days} · study today to keep it`}
            />
            <StatTile label="Time this week" value={`${o.active_minutes_7d} min`} sub={`${o.active_days_30d} active days this month`} />
            <StatTile
              label="Concepts mastered"
              value={`${o.concepts_mastered}`}
              sub={`of ${o.concepts_practised} practised · ${o.study_sessions_completed} session${o.study_sessions_completed === 1 ? "" : "s"} done`}
            />
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <ActivityChart days={report.daily} />
            <div className="flex flex-col gap-5">
              <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="reviews-title">
                <h2 id="reviews-title" className="text-sm font-semibold text-ink">
                  Reviews
                </h2>
                {report.reviews.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Nothing scheduled. Topics that need another look appear here.</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {report.reviews.map((r) => (
                      <li key={r.concept_id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink first-letter:uppercase">{r.name}</span>
                          <span className={`text-xs ${r.overdue ? "font-semibold text-danger" : "text-muted"}`}>
                            {r.overdue ? "Due now" : `Due ${r.due_at ? new Date(r.due_at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "soon"}`}
                          </span>
                        </span>
                        <Link href={studyHref(r.concept_id)} className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-hover">
                          Review
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {report.memories.length > 0 && (
                <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="known-title">
                  <h2 id="known-title" className="text-sm font-semibold text-ink">
                    What your tutor remembers
                  </h2>
                  <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-2">
                    {report.memories.map((m, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
                        <span>{m.fact}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          <div className={report.mistakes.total_wrong ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]" : "grid gap-5"}>
            <Chapters chapters={report.chapters} />
            <Mistakes report={report} />
          </div>

          <Concepts concepts={report.concepts} />
          <Timeline report={report} />
        </>
      )}
    </AppPage>
  );
}
