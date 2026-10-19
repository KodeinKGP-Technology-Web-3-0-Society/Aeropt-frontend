"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppPage } from "@/components/AppPage";
import {
  fetchPlan,
  fetchPlanProfile,
  savePlanSettings,
  type ExamChoice,
  type PlanDay,
  type PlanItem,
  type PlanProfile,
  type StudyPlan,
} from "@/lib/api/plan";

/*
 * The plan answers: how long until the exam, am I on pace, and what do I do on
 * each day this week? It is recomputed from the student's record on every load
 * (services/study_plan.py), so studying a topic moves the plan forward by
 * itself — nothing to tick off by hand.
 */

const fmt = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions) =>
  iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString([], opts) : "–";

const VERDICT: Record<StudyPlan["verdict"], { label: string; tone: string }> = {
  on_track: { label: "On track", tone: "bg-success/12 text-success" },
  tight: { label: "Tight", tone: "bg-warning/15 text-ink-2" },
  behind: { label: "Behind", tone: "bg-danger/10 text-danger" },
  done: { label: "Syllabus covered", tone: "bg-success/12 text-success" },
};

const KIND: Record<PlanItem["kind"], { label: string; tone: string }> = {
  review: { label: "Review", tone: "text-danger" },
  continue: { label: "Continue", tone: "text-ink-2" },
  learn: { label: "Learn", tone: "text-ink-2" },
  done: { label: "Done", tone: "text-success" },
};

const STATUS_DOT = {
  mastered: "bg-success",
  started: "bg-accent",
  review: "bg-danger",
  new: "bg-line-strong",
} as const;
const STATUS_LABEL = { mastered: "Mastered", started: "In progress", review: "Needs review", new: "Not started" } as const;

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

function studyHref(conceptId: string) {
  return `/study/${encodeURIComponent(conceptId)}`;
}

/* ── top: countdown, pace, coverage ────────────────────────────────────────── */

function Countdown({ plan }: { plan: StudyPlan }) {
  const s = plan.settings;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs text-muted">{s.exam_label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
        {plan.days_left}
        <span className="ml-1.5 text-base font-normal text-muted">days left</span>
      </p>
      <p className="mt-1 text-xs text-muted">
        {fmt(s.exam_date, { day: "numeric", month: "long", year: "numeric" })}
        {s.exam_date_estimated ? " (estimated; set the exact date in Adjust plan)" : ""}
      </p>
      {s.revision_weeks > 0 && (
        <p className="mt-3 rounded-lg bg-hover px-3 py-2 text-xs text-ink-2">
          Revision &amp; mock tests from <span className="font-semibold">{fmt(plan.revision_start, { day: "numeric", month: "short" })}</span>{" "}
          ({s.revision_weeks} weeks)
        </p>
      )}
    </section>
  );
}

function Pace({ plan, onUseMinutes, saving }: { plan: StudyPlan; onUseMinutes: (m: number) => void; saving: boolean }) {
  const v = VERDICT[plan.verdict];
  const s = plan.settings;
  const hours = Math.round(plan.remaining_minutes / 60);
  let text: string;
  if (plan.verdict === "done") text = "Every syllabus topic is mastered. Keep reviewing and practising PYQs until the exam.";
  else if (plan.verdict === "on_track")
    text = `At ${s.daily_minutes} min a day you finish the syllabus by ${fmt(plan.finish_date, { day: "numeric", month: "short" })}, before revision starts.`;
  else if (plan.verdict === "tight")
    text = `At ${s.daily_minutes} min a day you finish by ${fmt(plan.finish_date, { day: "numeric", month: "short" })}, eating into revision time.`;
  else
    text = `At ${s.daily_minutes} min a day you'd finish around ${fmt(plan.finish_date, { day: "numeric", month: "short", year: "numeric" })}, which is after the exam.`;
  const needsMore = plan.minutes_needed != null && plan.minutes_needed > s.daily_minutes && plan.verdict !== "done";
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">Pace</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${v.tone}`}>{v.label}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{text}</p>
      <p className="mt-2 text-xs text-muted">
        About {hours} hour{hours === 1 ? "" : "s"} of study left · {s.study_days} days a week
      </p>
      {needsMore && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onUseMinutes(Math.min(600, plan.minutes_needed!))}
          className="mt-3 cursor-pointer rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-ink-on transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          Plan {plan.minutes_needed} min a day to finish in time
        </button>
      )}
    </section>
  );
}

function Coverage({ plan }: { plan: StudyPlan }) {
  const pct = plan.topics_total ? Math.round((plan.topics_mastered / plan.topics_total) * 100) : 0;
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs text-muted">Syllabus mastered</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">
        {plan.topics_mastered}
        <span className="text-base font-normal text-muted">/{plan.topics_total}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hover" role="img" aria-label={`${pct}% of syllabus topics mastered`}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct ? 2 : 0, pct)}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {plan.topics_remaining} topics to go{plan.reviews_pending ? ` · ${plan.reviews_pending} review${plan.reviews_pending === 1 ? "" : "s"} pending` : ""}
      </p>
    </section>
  );
}

/* ── this week ─────────────────────────────────────────────────────────────── */

function DayCard({ day, isToday }: { day: PlanDay; isToday: boolean }) {
  return (
    <li
      className={`flex min-w-0 flex-col rounded-2xl border p-3.5 ${
        isToday ? "border-accent/50 bg-accent-soft/30" : day.rest ? "border-dashed border-line bg-transparent" : "border-line bg-surface"
      }`}
      aria-current={isToday ? "date" : undefined}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className={`text-sm font-semibold ${isToday ? "text-accent" : "text-ink"}`}>
          {isToday ? "Today" : fmt(day.date, { weekday: "short" })}
          <span className="ml-1.5 text-xs font-normal text-muted">{fmt(day.date, { day: "numeric", month: "short" })}</span>
        </p>
        {!day.rest && day.minutes > 0 && <span className="shrink-0 text-[11px] tabular-nums text-muted">{day.minutes} min</span>}
      </div>
      {day.rest ? (
        <p className="mt-2 text-xs text-muted">Rest day</p>
      ) : day.items.length === 0 ? (
        <p className="mt-2 text-xs text-muted">{isToday && day.minutes_done ? `Done for today: ${day.minutes_done} min studied.` : "Free"}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {day.items.map((it, i) => (
            <li key={`${it.concept_id}-${i}`}>
              <Link href={studyHref(it.concept_id)} className="group block rounded-lg px-1.5 py-1 transition-colors hover:bg-hover">
                <span className={`text-[10px] font-bold uppercase tracking-wide ${KIND[it.kind].tone}`}>
                  {it.kind === "done" ? "✓ " : ""}
                  {KIND[it.kind].label}
                  {it.subject ? <span className="font-normal normal-case tracking-normal text-muted"> · {it.subject}</span> : null}
                  {it.minutes ? <span className="font-normal normal-case tracking-normal text-muted"> · {it.minutes} min</span> : null}
                </span>
                <span className={`block truncate text-xs ${it.kind === "done" ? "text-muted line-through decoration-muted/50" : "text-ink group-hover:underline"}`}>
                  {it.topic}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── milestones + roadmap ──────────────────────────────────────────────────── */

function Milestones({ plan }: { plan: StudyPlan }) {
  const [showAll, setShowAll] = useState(false);
  if (!plan.milestones.length) return null;
  const preview = 6;
  const visible = showAll ? plan.milestones : plan.milestones.slice(0, preview);
  return (
    <details className="rounded-2xl border border-line bg-surface">
      <summary id="milestones-title" className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        Milestones
      </summary>
      <div className="px-5 pb-5">
      <p className="text-xs text-muted">Each step is the next unfinished unit in every subject, from what you have already covered.</p>
      <ol className="mt-4 flex flex-col">
        {visible.map((m, i) => (
          <li key={`${m.by}-${i}`} className="relative flex gap-4 pb-5 last:pb-0">
            {i < visible.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden />}
            <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-ink bg-surface" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">By {fmt(m.by, { day: "numeric", month: "short", year: "numeric" })}</p>
              {m.subjects && m.subjects.length > 0 ? (
                <ul className="mt-1 flex flex-col gap-0.5">
                  {m.subjects.map((part) => (
                    <li key={part.subject + part.unit} className="text-sm text-ink-2">
                      <span className="font-medium text-ink">{part.subject}</span>
                      <span className="text-muted"> · </span>
                      {part.unit}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-0.5 text-sm text-ink-2">{m.units.join(" · ")}</p>
              )}
            </div>
          </li>
        ))}
        {plan.milestones.length > preview && (
          <li className="pb-5 pl-8">
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              className="cursor-pointer text-xs font-semibold text-ink-2 hover:text-ink"
            >
              {showAll ? "Show the next steps only" : `Show ${plan.milestones.length - preview} later steps`}
            </button>
          </li>
        )}
        {plan.settings.revision_weeks > 0 && (
          <li className="relative flex gap-4 pb-5">
            <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden />
            <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full bg-warning" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-ink">From {fmt(plan.revision_start, { day: "numeric", month: "short", year: "numeric" })}</p>
              <p className="mt-0.5 text-sm text-ink-2">Revision, PYQs and full mock tests</p>
            </div>
          </li>
        )}
        <li className="relative flex gap-4">
          <span className="relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full bg-ink" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-ink">{fmt(plan.settings.exam_date, { day: "numeric", month: "short", year: "numeric" })}</p>
            <p className="mt-0.5 text-sm text-ink-2">{plan.settings.exam_label}</p>
          </div>
        </li>
      </ol>
      </div>
    </details>
  );
}

function Together({ plan }: { plan: StudyPlan }) {
  const board = plan.together;
  const subjects = board?.subjects ?? [];
  const groups = new Map<string, StudyPlan["roadmap"]>();
  for (const unit of plan.roadmap) {
    const subject = unit.subject || "Syllabus";
    const list = groups.get(subject);
    if (list) list.push(unit);
    else groups.set(subject, [unit]);
  }
  const behind = board?.behind;
  let metric = "The plan takes the next topic from each subject in turn.";
  if (board?.level) metric = `All subjects are level at ${board.percent}% covered.`;
  else if (behind) metric = `${behind} is the furthest behind, at ${board?.percent}% covered. The other subjects stay in step with it.`;
  return (
    <details className="rounded-2xl border border-line bg-surface">
      <summary id="together-title" className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
        All three subjects
      </summary>
      <div className="px-5">
        <p className="mt-2 text-3xl font-semibold tabular-nums text-ink">
          {board ? board.percent : 0}
          <span className="ml-1.5 text-base font-normal text-muted">% in step</span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{metric}</p>
      </div>
      {subjects.length > 0 && (
        <ul className="mt-4 grid gap-3 px-5 sm:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.subject} className="rounded-xl border border-line px-3 py-3">
              <p className="text-sm font-semibold text-ink">{subject.subject}</p>
              <p className="mt-1 text-xs tabular-nums text-muted">
                {subject.topics_started}/{subject.topics_total} covered · {subject.topics_mastered} mastered
              </p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-hover"
                role="img"
                aria-label={`${subject.subject}: ${subject.percent}% covered`}
              >
                <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(subject.percent ? 2 : 0, subject.percent)}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-2">
                {subject.next_unit ? `Next unit: ${subject.next_unit}` : "Nothing left in this subject"}
              </p>
              {subject.finish_by && (
                <p className="mt-0.5 text-xs text-muted">
                  Subject finishes {fmt(subject.finish_by, { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      <ol className="mt-4 divide-y divide-line border-t border-line">
        {(subjects.length ? subjects.map((row) => row.subject) : [...groups.keys()]).map((subject) => (
          <li key={subject}>
            <details className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-3 text-sm font-medium text-ink hover:bg-hover">
                {subject} units
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden>
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </summary>
              <ul className="divide-y divide-line/60">
                {(groups.get(subject) ?? []).map((u) => (
                  <UnitRow key={subject + u.unit} unit={u} />
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </details>
  );
}

function UnitRow({ unit }: { unit: StudyPlan["roadmap"][number] }) {
  const u = unit;
  return (
    <li>
      <details className="group/unit">
        <summary className="flex cursor-pointer items-center gap-3 px-5 py-2.5 hover:bg-hover">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink">{u.unit}</span>
              <span className="shrink-0 text-xs text-muted">
                {u.complete ? <span className="font-semibold text-success">Mastered</span> : u.finish_by ? `by ${fmt(u.finish_by, { day: "numeric", month: "short" })}` : ""}
              </span>
            </span>
            <span className="mt-1.5 flex items-center gap-2">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover" aria-hidden>
                <span className="block h-full rounded-full bg-accent" style={{ width: `${u.total ? (u.mastered / u.total) * 100 : 0}%` }} />
              </span>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-muted">
                {u.mastered}/{u.total}
              </span>
            </span>
          </span>
        </summary>
        <ul className="flex flex-wrap gap-1.5 px-5 pb-3">
          {u.topics.map((t) => (
            <li key={t.concept_id + t.topic}>
              <Link href={studyHref(t.concept_id)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-accent hover:text-ink">
                <span className="sr-only">{STATUS_LABEL[t.status]}: </span>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[t.status]}`} aria-hidden />
                {t.topic}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/* ── settings ──────────────────────────────────────────────────────────────── */

function AdjustPlan({
  plan,
  profile,
  saving,
  onSave,
  onClose,
}: {
  plan: StudyPlan;
  profile: PlanProfile;
  saving: boolean;
  onSave: (v: { exam: ExamChoice; targetYear: number; dailyMinutes: number; studyDays: number; revisionWeeks: number; examDate: string }) => void;
  onClose: () => void;
}) {
  const thisYear = new Date().getFullYear();
  const [exam, setExam] = useState<ExamChoice>(profile.exam);
  const [year, setYear] = useState<number>(profile.targetYear ?? Number(plan.settings.exam_date.slice(0, 4)));
  const [minutes, setMinutes] = useState(plan.settings.daily_minutes);
  const [days, setDays] = useState(plan.settings.study_days);
  const [revision, setRevision] = useState(plan.settings.revision_weeks);
  const [examDate, setExamDate] = useState(plan.settings.exam_date_estimated ? "" : plan.settings.exam_date.slice(0, 10));
  const field = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent";
  return (
    <section className="rounded-2xl border border-accent/40 bg-surface p-5" aria-labelledby="adjust-title">
      <div className="flex items-center justify-between">
        <h2 id="adjust-title" className="text-sm font-semibold text-ink">Adjust plan</h2>
        <button type="button" onClick={onClose} className="cursor-pointer text-xs text-muted hover:text-ink">Close</button>
      </div>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ exam, targetYear: year, dailyMinutes: minutes, studyDays: days, revisionWeeks: revision, examDate });
        }}
      >
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Exam
          <select className={field} aria-label="Exam" value={exam} onChange={(e) => setExam(e.target.value as ExamChoice)}>
            <option value="BOTH">JEE Main + Advanced</option>
            <option value="JEE_MAINS">JEE Main only</option>
            <option value="JEE_ADVANCED">JEE Advanced</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Exam year
          <select className={field} aria-label="Exam year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[thisYear, thisYear + 1, thisYear + 2, thisYear + 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Exact exam date <span className="font-normal text-muted">(optional, once announced)</span>
          <input type="date" className={field} aria-label="Exact exam date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Study time per day
          <select className={field} aria-label="Study time per day" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {[30, 45, 60, 90, 120, 150, 180, 240, 300].concat(minutes).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b).map((m) => (
              <option key={m} value={m}>{formatMinutes(m)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Study days per week
          <select className={field} aria-label="Study days per week" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[3, 4, 5, 6, 7].map((d) => (
              <option key={d} value={d}>{d} days{d === 7 ? " (no rest day)" : ""}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-2">
          Keep for revision before the exam
          <select className={field} aria-label="Revision weeks" value={revision} onChange={(e) => setRevision(Number(e.target.value))}>
            {[0, 2, 4, 6, 8, 10, 12].map((w) => (
              <option key={w} value={w}>{w === 0 ? "No revision block" : `${w} weeks`}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-50">
            {saving ? "Saving…" : "Save and replan"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PlanContent() {
  const [profile, setProfile] = useState<PlanProfile | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let live = true;
    fetchPlanProfile()
      .then(async (prof) => {
        const p = await fetchPlan(prof);
        if (!live) return;
        setProfile(prof);
        setPlan(p);
      })
      .catch((e: unknown) => live && setError(e instanceof Error ? e.message : "Could not build your plan."));
    return () => {
      live = false;
    };
  }, [reloadKey]);

  const save = useCallback(
    async (v: { exam: ExamChoice; targetYear: number; dailyMinutes: number; studyDays: number; revisionWeeks: number; examDate: string }) => {
      setSaving(true);
      try {
        await savePlanSettings(v);
        setAdjusting(false);
        setError(null);
        setReloadKey((k) => k + 1);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save your plan settings.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const useMinutes = useCallback(
    (m: number) => {
      if (!plan || !profile) return;
      void save({
        exam: profile.exam,
        targetYear: profile.targetYear ?? Number(plan.settings.exam_date.slice(0, 4)),
        dailyMinutes: m,
        studyDays: plan.settings.study_days,
        revisionWeeks: plan.settings.revision_weeks,
        examDate: plan.settings.exam_date_estimated ? "" : plan.settings.exam_date.slice(0, 10),
      });
    },
    [plan, profile, save],
  );

  if (error && !plan) {
    return (
      <AppPage title="Plan">
        <div className="max-w-md rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <button type="button" onClick={() => { setError(null); setReloadKey((k) => k + 1); }} className="mt-4 cursor-pointer rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-ink-on">
            Try again
          </button>
        </div>
      </AppPage>
    );
  }
  if (!plan || !profile) {
    return (
      <AppPage title="Plan" busy>
        <div className="grid animate-pulse gap-5 motion-reduce:animate-none">
          <div className="h-56 rounded-2xl bg-hover" />
          <div className="grid gap-3 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-hover" />)}</div>
        </div>
      </AppPage>
    );
  }

  const examName = plan.settings.exam_label.replace(" (session 1)", "");

  return (
    <AppPage
      title={`Your road to ${examName}`}
      lede="Rebuilt from your progress every time you open it. Study a topic and the plan moves on by itself."
      actions={
        <button type="button" onClick={() => setAdjusting((a) => !a)} aria-expanded={adjusting}
          className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-hover">
          Adjust plan
        </button>
      }
    >
        {error && <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5 text-sm text-danger">{error}</p>}
        {adjusting && <AdjustPlan plan={plan} profile={profile} saving={saving} onSave={(v) => void save(v)} onClose={() => setAdjusting(false)} />}

        <section aria-labelledby="week-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="week-title" className="text-xl font-semibold text-ink">This week</h2>
            <span className="text-sm text-muted">reviews first · then topics you started · then one new topic from each subject</span>
          </div>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {plan.week.map((d) => (
              <DayCard key={d.date} day={d} isToday={d.date.slice(0, 10) === plan.today.slice(0, 10)} />
            ))}
          </ol>
        </section>

        <div className="grid gap-3 lg:grid-cols-3">
          <Countdown plan={plan} />
          <Pace plan={plan} onUseMinutes={useMinutes} saving={saving} />
          <Coverage plan={plan} />
        </div>

        <div className="flex flex-col gap-4">
          <Milestones plan={plan} />
          <Together plan={plan} />
        </div>
    </AppPage>
  );
}
