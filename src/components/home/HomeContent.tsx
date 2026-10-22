"use client";

import Link from "next/link";
import { studyHref } from "@/lib/routes";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/components/AppContext";
import type { ClassroomToday } from "@/lib/api/classroom";
import { fetchPlan, type PlanItem, type StudyPlan } from "@/lib/api/plan";
import { fetchProgressCached, type ProgressOverview, type ProgressReport } from "@/lib/api/progress";
import { fetchStudyOverview, type StudyOverview, type UpNextItem } from "@/lib/api/study";
import { useHomeState } from "./useHomeState";

/*
 * Home answers three questions, in this order:
 *   1. What should I do right now?     → Continue / today's plan
 *   2. How am I doing?                  → one line of numbers, from the same record as /progress
 *   3. What needs attention?            → reviews, insights, syllabus coverage
 * A student with no history sees a welcome, how JeePath works, and one clear
 * first step instead of a dashboard of zeros.
 *
 * Layout: sections are grouped by space, headings and hairlines, not boxes.
 * The only filled shape on the page is the one teal button for the next step.
 */

const QUICK_TOPICS = ["Projectile motion", "Newton's laws", "Electric field", "Simple harmonic motion", "Ray optics", "Photoelectric effect"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getContinueHref(c: { concept_id: string; study_session_id?: string | null }) {
  return studyHref(c.concept_id, { session: c.study_session_id });
}


/* ── building blocks ───────────────────────────────────────────────────────── */

function Section({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-accent">
      {children}
    </Link>
  );
}

function Arrow() {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  );
}

function Bar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-hover" role="img" aria-label={label}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${total ? Math.max(value ? 3 : 0, (value / total) * 100) : 0}%` }} />
    </div>
  );
}

const KIND: Record<UpNextItem["kind"], { tag: string; cta: string }> = {
  review: { tag: "Review due", cta: "Start review" },
  resume: { tag: "Continue where you left off", cta: "Resume" },
  next: { tag: "Up next", cta: "Start" },
  start: { tag: "Start here", cta: "Start" },
};

/* ── sections ──────────────────────────────────────────────────────────────── */

function WeekLine({ o }: { o: ProgressOverview }) {
  const n = (v: ReactNode) => <span className="font-semibold tabular-nums text-ink">{v}</span>;
  const streak = o.streak_days ? (
    <>
      {n(`${o.streak_days}-day`)} streak
      {o.active_today ? <span className="text-success">, today counts</span> : ", study today to keep it"}
    </>
  ) : o.best_streak_days ? (
    <>No streak right now (best {n(o.best_streak_days)})</>
  ) : (
    <>No streak yet</>
  );
  const parts = [
    streak,
    <>
      {n(o.attempts_7d)} questions this week{o.accuracy_7d != null ? <>, {n(`${Math.round(o.accuracy_7d * 100)}%`)} right</> : null}
    </>,
    <>{n(`${o.active_minutes_7d} min`)} studied this week</>,
    <>
      {n(o.concepts_mastered)} of {o.concepts_practised} practised concepts mastered
    </>,
  ];
  return (
    <p aria-label="This week" className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
      {parts.map((p, i) => (
        <span key={i}>{p}</span>
      ))}
    </p>
  );
}

function Continue({ items }: { items: UpNextItem[] }) {
  if (!items.length) {
    return (
      <section>
        <p className="text-sm text-ink-2">
          Nothing queued yet. <TextLink href="/study">Pick a topic in the study room</TextLink> to get going.
        </p>
      </section>
    );
  }
  const [first, ...rest] = items;
  return (
    <section aria-label="Continue">
      <Link href={getContinueHref(first)} className="group block">
        <p className={`text-sm font-medium ${first.kind === "review" ? "text-danger" : "text-accent"}`}>{KIND[first.kind].tag}</p>
        <p className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-ink first-letter:uppercase sm:text-4xl">{first.name}</p>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
          <span className="text-muted">{first.chapter}.</span> {first.reason}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-on transition-colors group-hover:bg-accent-hover">
          {KIND[first.kind].cta}
          <Arrow />
        </span>
      </Link>
      {rest.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-muted">After that</h2>
          <ul className="mt-1 divide-y divide-line border-t border-line">
            {rest.map((item) => (
              <li key={item.concept_id}>
                <Link href={getContinueHref(item)} className="group flex items-baseline gap-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink first-letter:uppercase group-hover:text-accent">{item.name}</span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-muted">{item.reason}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{KIND[item.kind].tag}</span>
                </Link>
              </li>
            ))}
          </ul>
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
    <Section title="Today's plan" action={<TextLink href="/plan">Full plan</TextLink>}>
      {!plan || !today ? (
        <p className="text-sm text-muted">Loading your plan. If it never shows, set it up on the Plan page.</p>
      ) : today.rest ? (
        <p className="text-sm text-ink-2">Rest day. Come back tomorrow, or review something light if you feel like it.</p>
      ) : today.items.length === 0 ? (
        <p className="text-sm text-ink-2">
          <span className="font-medium text-success">Done for today.</span>
          {today.minutes_done ? ` ${today.minutes_done} min studied.` : ""}
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {today.items.map((it, i) => (
            <li key={`${it.concept_id}-${i}`}>
              <Link href={studyHref(it.concept_id)} className="group flex items-baseline gap-3 py-3">
                <span className={`w-16 shrink-0 text-xs font-medium ${it.kind === "review" ? "text-danger" : it.kind === "done" ? "text-success" : it.kind === "continue" ? "text-accent" : "text-muted"}`}>
                  {it.kind === "done" ? "✓ " : ""}{label(it.kind)}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm group-hover:text-accent ${it.kind === "done" ? "text-muted line-through decoration-muted/50" : "text-ink"}`}>{it.topic}</span>
                {it.minutes > 0 && <span className="shrink-0 text-xs tabular-nums text-muted">{it.minutes} min</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {plan && (
        <p className="mt-3 text-xs text-muted">
          {plan.days_left} days to {plan.settings.exam_label.replace(" (session 1)", "")},{" "}
          <span className={plan.verdict === "behind" ? "font-semibold text-danger" : plan.verdict === "tight" ? "font-semibold text-ink-2" : "font-semibold text-success"}>
            {plan.verdict === "on_track" ? "on track" : plan.verdict === "tight" ? "pace is tight" : plan.verdict === "behind" ? "behind pace" : "syllabus covered"}
          </span>
          {tomorrow ? `. Tomorrow: ${tomorrow.items[0].topic}` : ""}
        </p>
      )}
    </Section>
  );
}

function Attention({ report }: { report: ProgressReport }) {
  const reviews = report.reviews.slice(0, 3);
  const insights = report.insights.filter((i) => i.action !== "review").slice(0, 3);
  if (!reviews.length && !insights.length) {
    return (
      <Section title="Needs attention">
        <p className="text-sm text-muted">Nothing pressing. Due reviews and patterns in your mistakes show up here.</p>
      </Section>
    );
  }
  return (
    <Section title="Needs attention" action={<TextLink href="/progress">Progress</TextLink>}>
      <ul className="flex flex-col gap-4">
        {reviews.map((r) => (
          <li key={r.concept_id}>
            <Link href={studyHref(r.concept_id)} className="group block">
              <span className="block text-sm font-medium text-ink first-letter:uppercase group-hover:text-accent">Review {r.name}</span>
              <span className={`text-xs ${r.overdue ? "font-medium text-danger" : "text-muted"}`}>
                {r.overdue ? "Due now" : `Due ${r.due_at ? new Date(r.due_at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "soon"}`}
              </span>
            </Link>
          </li>
        ))}
        {insights.map((ins, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-2">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${ins.tone === "good" ? "bg-success" : ins.tone === "pattern" ? "bg-warning" : "bg-accent"}`} aria-hidden />
            <span className="flex-1">
              {ins.text}
              {ins.concept_id && ins.action && (
                <>
                  {" "}
                  <TextLink href={studyHref(ins.concept_id)}>Study it</TextLink>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SyllabusProgress({ overview, readiness }: { overview: StudyOverview; readiness?: { score: number; label: string } | null }) {
  const total = overview.syllabus.reduce((a, u) => a + u.total, 0);
  const started = overview.syllabus.reduce((a, u) => a + u.started, 0);
  const mastered = overview.syllabus.reduce((a, u) => a + u.mastered, 0);
  const active = overview.syllabus.filter((u) => u.started > 0).sort((a, b) => b.started / b.total - a.started / a.total).slice(0, 4);
  return (
    <Section title="JEE syllabus" action={<TextLink href="/study">Study room</TextLink>}>
      <p className="text-sm text-ink-2">
        <span className="text-2xl font-semibold tabular-nums text-ink">{started}</span>
        <span className="tabular-nums text-muted"> / {total}</span> topics started, {mastered} mastered
      </p>
      <div className="mt-2">
        <Bar value={started} total={total} label={`${started} of ${total} syllabus topics started`} />
      </div>
      {active.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3">
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
        <p className="mt-5 text-sm text-ink-2">
          Exam readiness <span className="font-semibold tabular-nums text-ink">{Math.round(readiness.score)}/100</span> ({readiness.label}).{" "}
          <TextLink href="/readiness">Details</TextLink>
        </p>
      )}
    </Section>
  );
}

function Shortcuts() {
  const items = [
    { href: "/study?mode=practice", label: "Practise questions" },
    { href: "/doubt", label: "Check my working" },
    { href: "/progress", label: "Mistake notebook" },
    { href: "/plan", label: "This week's plan" },
    { href: "/chat", label: "Ask the tutor" },
  ];
  return (
    <nav aria-label="Shortcuts" className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5">
      {items.map((it) => (
        <TextLink key={it.href} href={it.href}>{it.label}</TextLink>
      ))}
    </nav>
  );
}

/* ── first visit ───────────────────────────────────────────────────────────── */

function Welcome({ firstName, today }: { firstName: string; today: ClassroomToday | null }) {
  const firstTopic = today?.title;
  const steps = [
    { title: "Learn it properly", body: "The study room teaches one topic in parts, walks through worked examples, then gives you calibrated JEE questions.", href: "/study", cta: "Open the study room" },
    { title: "Ask anything, anytime", body: "Stuck on a doubt? The tutor explains step by step, draws diagrams and checks your working.", href: "/chat", cta: "Ask the tutor" },
    { title: "Watch it add up", body: "Every answer is tracked: your streak, weak spots and a mistake notebook. Your tutor remembers all of it.", href: "/progress", cta: "See progress" },
  ];
  return (
    <div className="flex flex-col gap-16">
      <section>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          {firstName ? `Hi ${firstName}, let's` : "Let's"} start your JEE prep.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">
          Your tutor teaches each topic step by step, practises with you, and remembers how it went, so every session
          picks up exactly where you need it.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={studyHref(firstTopic || "Units and measurement")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover"
          >
            Start your first lesson{firstTopic ? `: ${firstTopic}` : ""}
            <Arrow />
          </Link>
          <TextLink href="/chat">Or ask a doubt instead</TextLink>
        </div>
      </section>

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="text-base font-semibold text-ink">How it works</h2>
        <ol className="mt-4 grid gap-x-10 gap-y-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-ink">
                <span className="mr-2 tabular-nums text-muted">{i + 1}</span>
                {s.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{s.body}</p>
              <p className="mt-3"><TextLink href={s.href}>{s.cta}</TextLink></p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="quick-title">
        <h2 id="quick-title" className="text-base font-semibold text-ink">Or jump into any topic</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_TOPICS.map((t) => (
            <Link key={t} href={studyHref(t)} className="rounded-full border border-line px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-ink">
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
    // The plan section fills in when ready; it never holds the page back.
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
        <div className="mx-auto flex max-w-6xl animate-pulse flex-col gap-4 motion-reduce:animate-none">
          <div className="h-3 w-40 rounded bg-hover" />
          <div className="h-9 w-72 rounded-lg bg-hover" />
          <div className="h-4 w-full max-w-2xl rounded bg-hover" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-3"><div className="h-4 w-28 rounded bg-hover" /><div className="h-10 w-96 max-w-full rounded-lg bg-hover" /><div className="h-4 w-80 max-w-full rounded bg-hover" /></div>
            <div className="flex flex-col gap-3"><div className="h-4 w-32 rounded bg-hover" /><div className="h-4 w-full rounded bg-hover" /><div className="h-4 w-full rounded bg-hover" /></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        {isNew ? (
          <Welcome firstName={firstName} today={home.today} />
        ) : (
          <>
            <header>
              <p className="text-sm text-muted">{new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                {greeting()}{firstName ? `, ${firstName}` : ""}
              </h1>
              {o && <WeekLine o={o} />}
            </header>

            <div className="grid items-start gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="flex flex-col gap-14">
                <Continue items={overview?.up_next ?? []} />
                <TodaysPlan plan={plan} />
              </div>
              <aside className="flex flex-col gap-12 lg:border-l lg:border-line lg:pl-10">
                {report && <Attention report={report} />}
                {overview && <SyllabusProgress overview={overview} readiness={home.readiness} />}
              </aside>
            </div>
          </>
        )}

        <Shortcuts />
      </div>
    </main>
  );
}
