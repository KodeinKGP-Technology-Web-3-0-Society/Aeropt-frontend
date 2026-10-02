"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppContext";
import type { ClassroomToday } from "@/lib/api/classroom";
import { fetchPlan, type PlanItem, type StudyPlan } from "@/lib/api/plan";
import { fetchProgressCached, type ProgressReport } from "@/lib/api/progress";
import { fetchStudyOverview, type StudyOverview, type UpNextItem } from "@/lib/api/study";
import { useHomeState } from "./useHomeState";

/*
 * Home answers three questions, in this order:
 *   1. What should I do right now?     → Continue / today's plan
 *   2. How am I doing?                  → four numbers, from the same record as /progress
 *   3. What needs attention?            → reviews, insights, syllabus coverage
 * A student with no history sees a welcome, how Prepwise works, and one clear
 * first step instead of a dashboard of zeros.
 */

const QUICK_TOPICS = ["Projectile motion", "Newton's laws", "Electric field", "Simple harmonic motion", "Ray optics", "Photoelectric effect"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function studyHref(c: { concept_id: string; study_session_id?: string | null }) {
  const base = `/study/${encodeURIComponent(c.concept_id)}`;
  return c.study_session_id ? `${base}?session=${c.study_session_id}` : base;
}


/* ── building blocks ───────────────────────────────────────────────────────── */

function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col rounded-2xl border border-line bg-surface p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-3.5 flex items-baseline justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" | null }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

function Bar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-hover" role="img" aria-label={label}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${total ? Math.max(value ? 3 : 0, (value / total) * 100) : 0}%` }} />
    </div>
  );
}

const KIND: Record<UpNextItem["kind"], { tag: string; cta: string }> = {
  review: { tag: "Review due", cta: "Start review" },
  resume: { tag: "Continue", cta: "Resume" },
  next: { tag: "Up next", cta: "Start" },
  start: { tag: "Start here", cta: "Start" },
};

/* ── sections ──────────────────────────────────────────────────────────────── */

function ContinueCard({ items }: { items: UpNextItem[] }) {
  if (!items.length) return null;
  const [first, ...rest] = items;
  return (
    <section className="flex flex-col gap-3">
      <Link
        href={studyHref(first)}
        className="group flex flex-col justify-between gap-5 rounded-2xl border border-accent/40 bg-accent-soft/40 p-6 transition-colors hover:border-accent"
      >
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">{KIND[first.kind].tag}</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-ink first-letter:uppercase sm:text-3xl">{first.name}</p>
          <p className="mt-1 text-xs text-muted">{first.chapter}</p>
          <p className="mt-3 text-sm text-ink-2">{first.reason}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors group-hover:bg-accent-hover">
          {KIND[first.kind].cta} →
        </span>
      </Link>
      {rest.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rest.map((item) => (
            <Link key={item.concept_id} href={studyHref(item)} className="rounded-2xl border border-line bg-surface px-4 py-3 transition-colors hover:border-accent">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{KIND[item.kind].tag}</span>
              <span className="mt-0.5 block truncate text-sm font-semibold text-ink first-letter:uppercase">{item.name}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted">{item.reason}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function TodaysPlan({ plan }: { plan: StudyPlan | null }) {
  const today = plan?.week[0];
  const tomorrow = plan?.week.slice(1).find((d) => !d.rest && d.items.length);
  const label = (k: PlanItem["kind"]) => (k === "review" ? "Review" : k === "continue" ? "Continue" : k === "done" ? "Done" : "Learn");
  return (
    <Card title="Today's plan" action={<Link href="/plan" className="text-xs font-semibold text-accent hover:underline">Full plan →</Link>}>
      {!plan || !today ? (
        <p className="rounded-xl bg-hover px-4 py-3 text-sm text-ink-2">Your plan is loading — or open the Plan page to set it up.</p>
      ) : today.rest ? (
        <p className="rounded-xl bg-hover px-4 py-3 text-sm text-ink-2">Rest day. Come back tomorrow — or review something light if you feel like it.</p>
      ) : today.items.length === 0 ? (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-ink-2">Done for today{today.minutes_done ? ` — ${today.minutes_done} min studied` : ""}. Nice work.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {today.items.map((it, i) => (
            <li key={`${it.concept_id}-${i}`}>
              <Link href={`/study/${encodeURIComponent(it.concept_id)}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-accent">
                <span className={`w-16 shrink-0 text-[10px] font-bold uppercase tracking-wide ${it.kind === "review" ? "text-danger" : it.kind === "done" ? "text-success" : it.kind === "continue" ? "text-accent" : "text-ink-2"}`}>
                  {it.kind === "done" ? "✓ " : ""}{label(it.kind)}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${it.kind === "done" ? "text-muted line-through decoration-muted/50" : "text-ink"}`}>{it.topic}</span>
                {it.minutes > 0 && <span className="shrink-0 text-[11px] tabular-nums text-muted">{it.minutes} min</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {plan && (
        <p className="mt-3 text-xs text-muted">
          {plan.days_left} days to {plan.settings.exam_label.replace(" (session 1)", "")} ·{" "}
          <span className={plan.verdict === "behind" ? "font-semibold text-danger" : plan.verdict === "tight" ? "font-semibold text-ink-2" : "font-semibold text-success"}>
            {plan.verdict === "on_track" ? "on track" : plan.verdict === "tight" ? "pace is tight" : plan.verdict === "behind" ? "behind pace" : "syllabus covered"}
          </span>
          {tomorrow ? ` · tomorrow: ${tomorrow.items[0].topic}` : ""}
        </p>
      )}
    </Card>
  );
}

function Attention({ report }: { report: ProgressReport }) {
  const reviews = report.reviews.slice(0, 3);
  const insights = report.insights.filter((i) => i.action !== "review").slice(0, 3);
  if (!reviews.length && !insights.length) {
    return (
      <Card title="Needs your attention">
        <p className="text-sm text-muted">Nothing pressing. Reviews and patterns in your mistakes show up here.</p>
      </Card>
    );
  }
  return (
    <Card title="Needs your attention" action={<Link href="/progress" className="text-xs font-semibold text-accent hover:underline">Progress →</Link>}>
      <ul className="flex flex-col gap-2.5">
        {reviews.map((r) => (
          <li key={r.concept_id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink first-letter:uppercase">Review: {r.name}</span>
              <span className={`text-xs ${r.overdue ? "font-semibold text-danger" : "text-muted"}`}>
                {r.overdue ? "Due now" : `Due ${r.due_at ? new Date(r.due_at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "soon"}`}
              </span>
            </span>
            <Link href={`/study/${encodeURIComponent(r.concept_id)}`} className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-ink hover:bg-hover">
              Review
            </Link>
          </li>
        ))}
        {insights.map((ins, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${ins.tone === "good" ? "bg-success" : ins.tone === "pattern" ? "bg-warning" : "bg-accent"}`} aria-hidden />
            <span className="flex-1">
              {ins.text}
              {ins.concept_id && ins.action && (
                <Link href={`/study/${encodeURIComponent(ins.concept_id)}`} className="ml-1.5 whitespace-nowrap text-xs font-semibold text-accent hover:underline">
                  Study it →
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SyllabusProgress({ overview, readiness }: { overview: StudyOverview; readiness?: { score: number; label: string } | null }) {
  const total = overview.syllabus.reduce((a, u) => a + u.total, 0);
  const started = overview.syllabus.reduce((a, u) => a + u.started, 0);
  const mastered = overview.syllabus.reduce((a, u) => a + u.mastered, 0);
  const active = overview.syllabus.filter((u) => u.started > 0).sort((a, b) => b.started / b.total - a.started / a.total).slice(0, 4);
  return (
    <Card title="JEE syllabus" action={<Link href="/study" className="text-xs font-semibold text-accent hover:underline">Open study →</Link>}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-semibold tabular-nums text-ink">
          {started}
          <span className="text-base text-muted">/{total}</span>
        </p>
        <p className="text-xs text-muted">topics started · {mastered} mastered</p>
      </div>
      <div className="mt-2">
        <Bar value={started} total={total} label={`${started} of ${total} syllabus topics started`} />
      </div>
      {active.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {active.map((u) => (
            <li key={u.unit}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate text-ink-2">{u.unit}</span>
                <span className="shrink-0 tabular-nums text-muted">{u.started}/{u.total}</span>
              </div>
              <Bar value={u.started} total={u.total} label={`${u.unit}: ${u.started} of ${u.total}`} />
            </li>
          ))}
        </ul>
      )}
      {readiness && readiness.score > 0 && (
        <Link href="/readiness" className="mt-4 flex items-center justify-between rounded-xl bg-hover px-3 py-2 text-xs text-ink-2 hover:text-ink">
          <span>Exam readiness</span>
          <span className="font-semibold tabular-nums">{Math.round(readiness.score)}/100 · {readiness.label}</span>
        </Link>
      )}
    </Card>
  );
}

function QuickActions() {
  const items = [
    { href: "/study?mode=practice", label: "Practise questions", sub: "Straight to questions, PYQs too" },
    { href: "/chat", label: "Ask the tutor", sub: "Any physics doubt, with diagrams" },
    { href: "/doubt", label: "Check my working", sub: "Paste a solution, find the slip" },
    { href: "/progress", label: "Mistake notebook", sub: "Questions worth another look" },
    { href: "/plan", label: "This week's plan", sub: "Day by day, until the exam" },
  ];
  return (
    <section aria-label="Shortcuts" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="rounded-2xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-accent">
          <span className="block text-sm font-semibold text-ink">{it.label}</span>
          <span className="mt-0.5 block text-xs text-muted">{it.sub}</span>
        </Link>
      ))}
    </section>
  );
}

/* ── first visit ───────────────────────────────────────────────────────────── */

function Welcome({ firstName, today }: { firstName: string; today: ClassroomToday | null }) {
  const firstTopic = today?.title;
  const steps = [
    { n: 1, title: "Learn it properly", body: "The study room teaches one topic in parts, walks through worked examples, then gives you calibrated JEE questions.", href: "/study", cta: "Open study" },
    { n: 2, title: "Ask anything, anytime", body: "Stuck on a doubt? The tutor explains step by step, draws diagrams and checks your working.", href: "/chat", cta: "Ask the tutor" },
    { n: 3, title: "Watch it add up", body: "Every answer is tracked. See your streak, weak spots and a mistake notebook — and your tutor remembers it all.", href: "/progress", cta: "See progress" },
  ];
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-accent/40 bg-accent-soft/40 p-6 sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Welcome to Prepwise</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {firstName ? `Hi ${firstName} — ` : ""}let&apos;s start your JEE Physics prep.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">
          Your AI tutor teaches each topic step by step, practises with you, and remembers how it went — so every session
          picks up exactly where you need it.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/study/${encodeURIComponent(firstTopic || "Units and measurement")}`}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover"
          >
            Start your first lesson{firstTopic ? `: ${firstTopic}` : ""} →
          </Link>
          <Link href="/chat" className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-hover">
            Ask a doubt instead
          </Link>
        </div>
      </section>

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="text-[11px] font-bold uppercase tracking-widest text-muted">How it works</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">{s.n}</span>
              <p className="mt-3 text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{s.body}</p>
              <Link href={s.href} className="mt-3 text-xs font-semibold text-accent hover:underline">{s.cta} →</Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quick-title" className="rounded-2xl border border-line bg-surface p-5">
        <h2 id="quick-title" className="text-sm font-semibold text-ink">Or jump into any topic</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_TOPICS.map((t) => (
            <Link key={t} href={`/study/${encodeURIComponent(t)}`} className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink">
              {t}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function HomeContent() {
  const { data } = useApp();
  const { home, loading } = useHomeState();
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [overview, setOverview] = useState<StudyOverview | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [agentLoaded, setAgentLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    Promise.allSettled([fetchProgressCached(), fetchStudyOverview()]).then(([p, o]) => {
      if (!live) return;
      if (p.status === "fulfilled") setReport(p.value);
      if (o.status === "fulfilled") setOverview(o.value);
      setAgentLoaded(true);
    });
    // The plan card fills in when ready; it never holds the page back.
    fetchPlan().then((p) => live && setPlan(p)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const firstName = (data.user.name || "").split(" ")[0] ?? "";
  const o = report?.overview;
  const isNew = agentLoaded && (!o || (o.questions_attempted === 0 && (report?.timeline.length ?? 0) === 0));

  if (!agentLoaded || loading) {
    return (
      <main className="px-4 pb-16 pt-24 sm:px-6" aria-busy="true">
        <div className="mx-auto grid max-w-6xl animate-pulse gap-5 motion-reduce:animate-none">
          <div className="h-9 w-72 rounded-lg bg-hover" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-hover" />)}</div>
          <div className="grid gap-5 lg:grid-cols-3"><div className="h-64 rounded-2xl bg-hover lg:col-span-2" /><div className="h-64 rounded-2xl bg-hover" /></div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {isNew ? (
          <Welcome firstName={firstName} today={home.today} />
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted">{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                  {greeting()}{firstName ? `, ${firstName}` : ""}
                </h1>
              </div>
              <Link href="/chat" className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-hover">
                Ask the tutor
              </Link>
            </header>

            {o && (
              <section aria-label="This week" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat
                  label="Streak"
                  value={`${o.streak_days} day${o.streak_days === 1 ? "" : "s"}`}
                  sub={o.active_today ? "Today counts ✓" : o.streak_days ? "Study today to keep it" : `Best ${o.best_streak_days}`}
                  tone={o.active_today ? "good" : null}
                />
                <Stat
                  label="Questions this week"
                  value={`${o.attempts_7d}`}
                  sub={o.accuracy_7d != null ? `${Math.round(o.accuracy_7d * 100)}% right` : "None answered yet"}
                />
                <Stat label="Time this week" value={`${o.active_minutes_7d} min`} sub={`${o.active_days_30d} active days this month`} />
                <Stat label="Concepts mastered" value={`${o.concepts_mastered}`} sub={`of ${o.concepts_practised} practised`} />
              </section>
            )}

            <div className="grid items-start gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {overview?.up_next.length ? (
                  <ContinueCard items={overview.up_next} />
                ) : (
                  <Card title="Continue">
                    <p className="text-sm text-muted">Pick a topic in the study room to get going.</p>
                  </Card>
                )}
              </div>
              <TodaysPlan plan={plan} />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-2">
              {report && <Attention report={report} />}
              {overview && <SyllabusProgress overview={overview} readiness={home.readiness} />}
            </div>
          </>
        )}

        <QuickActions />
      </div>
    </main>
  );
}
