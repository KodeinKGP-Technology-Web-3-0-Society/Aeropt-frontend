"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  type ClassroomToday,
  type TodayAction,
} from "@/lib/api/classroom";
import { useHomeState } from "./useHomeState";
import Link from "next/link";

/* ─── types ──────────────────────────────────────────────────────────── */
type SubjectMastery = {
  id: string; label: string; color: string; active: boolean;
  mastery: number; total: number; mastered: number; coming_soon?: boolean;
};
type StreakWeekDay = { date: string; active: boolean; is_today: boolean };
type Streak = { current_streak: number; week: StreakWeekDay[] };
type Insight = { type: string; title: string; body?: string; action?: string; action_label?: string; count?: number };
type PlanItem = { concept_id: string; title: string; status: string; when: string; chapter?: string; estimated_minutes?: number };

/* ─── helpers ────────────────────────────────────────────────────────── */
function formatAction(action: TodayAction): string {
  if (action === "lesson") return "Lesson";
  if (action === "revise") return "Revise";
  return "Assess";
}
function subjectAccent(id: string): string {
  if (id === "physics") return "#3b82f6";
  if (id === "chemistry") return "#10b981";
  return "#f59e0b";
}
function subjectBg(id: string): string {
  if (id === "physics") return "rgba(59,130,246,0.07)";
  if (id === "chemistry") return "rgba(16,185,129,0.07)";
  return "rgba(245,158,11,0.07)";
}
function insightIcon(type: string): ReactNode {
  if (type === "weak_concepts")
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}

/* ─── layout helpers ─────────────────────────────────────────────────── */
function Section({ title, action, actionHref, children }: {
  title: string; action?: string; actionHref?: string; children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">{title}</h2>
        {action && actionHref && (
          <Link href={actionHref} className="text-[11px] font-semibold text-accent hover:underline">{action}</Link>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── today card ─────────────────────────────────────────────────────── */
function TodayCard({
  today, actionPending, actionError, onOpen, onComplete, onDismiss,
}: {
  today: ClassroomToday | null;
  actionPending: boolean;
  actionError: string | null;
  onOpen: (t: ClassroomToday) => void;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  if (!today) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-8 py-10 text-center">
        <div className="rounded-full bg-hover p-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">All caught up!</h3>
          <p className="mt-1 text-sm text-muted">No tasks for today. The AI tutor is ready when you are.</p>
        </div>
        <Link href="/chat" className="mt-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface hover:bg-ink/90 transition-colors">
          Ask a Doubt
        </Link>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl bg-ink" />
      <div className="mt-1">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {formatAction(today.action)}{today.provisional ? " · Provisional" : ""} · {today.minutes} min
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">{today.title}</h3>
      </div>
      {actionError && <p className="mt-3 text-sm text-red-500">{actionError}</p>}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => onOpen(today)} disabled={actionPending}
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-surface hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Start Session →
        </button>
        <button type="button" onClick={onComplete} disabled={actionPending}
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-hover transition-colors disabled:opacity-50">
          Mark Complete
        </button>
        <button type="button" onClick={onDismiss} disabled={actionPending}
          className="px-3 py-2 text-xs text-muted hover:text-ink transition-colors disabled:opacity-50">
          Skip
        </button>
      </div>
    </div>
  );
}

/* ─── mastery ring ───────────────────────────────────────────────────── */
function MasteryRing({ mastery, size, stroke, color }: { mastery: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (mastery / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-hover)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

function SubjectRings({ subjects }: { subjects: SubjectMastery[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {subjects.map((s) => (
        <div key={s.id} className="flex flex-col items-center gap-3 rounded-xl border border-line p-5 transition-all hover:border-ink"
          style={{ background: subjectBg(s.id) }}>
          <div className="relative">
            <MasteryRing mastery={s.mastery} size={72} stroke={6} color={subjectAccent(s.id)} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-base font-bold tabular-nums text-ink">
                {s.coming_soon ? "—" : `${s.mastery}%`}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-ink">{s.label}</p>
            {s.coming_soon
              ? <p className="mt-0.5 text-[10px] text-muted">Coming soon</p>
              : <p className="mt-0.5 text-[10px] text-muted">{s.mastered}/{s.total} mastered</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── streak ─────────────────────────────────────────────────────────── */
function StreakRow({ streak }: { streak: Streak }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4">
      <div className="flex flex-col">
        <span className="font-display text-2xl font-bold text-ink">{streak.current_streak}</span>
        <span className="text-[11px] text-muted">day streak</span>
      </div>
      <div className="flex items-center gap-1.5">
        {streak.week.map((day, i) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
              day.active ? "bg-ink" : day.is_today ? "border-2 border-ink" : "bg-hover"
            }`}>
              {day.active && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="text-[9px] font-semibold text-muted">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── insights ───────────────────────────────────────────────────────── */
function InsightCards({ insights }: { insights: Insight[] }) {
  if (!insights?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight, i) => (
        <div key={`${insight.type}-${i}`} className="flex items-start gap-4 rounded-xl border border-line bg-surface px-5 py-4">
          <div className="mt-0.5 shrink-0 text-muted">{insightIcon(insight.type)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{insight.title}</p>
            {insight.body && <p className="mt-0.5 text-[12px] text-muted leading-relaxed">{insight.body}</p>}
          </div>
          {insight.action && insight.action_label && (
            <Link href={insight.action} className="shrink-0 text-[11px] font-bold text-accent hover:underline">
              {insight.action_label}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── study queue ────────────────────────────────────────────────────── */
function StudyQueue({ plan, onOpen }: { plan: PlanItem[]; onOpen: (id: string) => void }) {
  const real = plan.filter(p => p.concept_id !== "__more__");
  const more = plan.find(p => p.concept_id === "__more__");
  if (real.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-5 py-5 text-center text-sm text-muted">
        Your study queue is empty. Start your first session to generate a plan.
      </div>
    );
  }
  return (
    <div className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface overflow-hidden">
      {real.map((item, i) => (
        <button key={item.concept_id} type="button" onClick={() => onOpen(item.concept_id)}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-hover focus-visible:outline-none">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              item.when === "today" ? "bg-ink text-surface" : "bg-hover text-muted"
            }`}>{i + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {item.chapter && `${item.chapter} · `}
                {item.estimated_minutes ? `~${item.estimated_minutes} min` : ""}
                {item.when === "today" && <span className="ml-1 font-semibold text-accent"> · Today</span>}
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      ))}
      {more && (
        <div className="flex items-center justify-between px-5 py-3 text-[11px] text-muted">
          <span>{more.title}</span>
          <Link href="/plan" className="font-semibold text-accent hover:underline">See full roadmap →</Link>
        </div>
      )}
    </div>
  );
}

/* ─── main dashboard ─────────────────────────────────────────────────── */
export default function HomeContent() {
  const router = useRouter();
  const {
    home, loading, error, actionPending, actionError,
    reload, openToday, openLesson, completeToday, dismissToday,
  } = useHomeState();

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-12 pt-[6.75rem] lg:px-8 animate-pulse" aria-busy="true">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="h-8 w-48 rounded-lg bg-hover" />
          <div className="h-44 rounded-2xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-[6.75rem]">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
          <h3 className="mb-2 text-base font-bold text-ink">Couldn&apos;t load dashboard</h3>
          <p className="mb-6 text-sm text-muted">{error}</p>
          <button type="button" onClick={reload}
            className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface hover:bg-ink/90 transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const streak: Streak = (home as any).streak ?? { current_streak: 0, week: [] };
  const insights: Insight[] = (home as any).insights ?? [];
  const subjectMastery: SubjectMastery[] = (home as any).subject_mastery ?? [];
  /* eslint-enable */

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-[6.75rem] lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">

        <header>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Dashboard</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Your Prepwise
          </h1>
          <p className="mt-1 text-sm text-muted">
            Personalised JEE prep. The AI knows where you are and what you need next.
          </p>
        </header>

        {/* Today */}
        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="sr-only">Today&apos;s Focus</h2>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Today&apos;s Focus</span>
            <Link href="/chat" className="text-[11px] font-semibold text-accent hover:underline">Ask a doubt →</Link>
          </div>
          <TodayCard today={home.today} actionPending={actionPending} actionError={actionError}
            onOpen={openToday} onComplete={completeToday} onDismiss={dismissToday} />
        </section>

        {/* AI Insights */}
        {insights.length > 0 && (
          <Section title="AI Insights">
            <InsightCards insights={insights} />
          </Section>
        )}

        {/* Subject Rings */}
        {subjectMastery.length > 0 && (
          <Section title="Mastery Overview">
            <SubjectRings subjects={subjectMastery} />
          </Section>
        )}

        {/* Streak */}
        <Section title="Consistency">
          {streak.week.length > 0
            ? <StreakRow streak={streak} />
            : <div className="rounded-xl border border-line bg-surface px-5 py-4 text-sm text-muted">Start studying to build your streak.</div>
          }
        </Section>

        {/* Agent Study Queue */}
        <Section title="Your Study Queue" action="Full Roadmap →" actionHref="/plan">
          <p className="mb-3 text-[12px] leading-relaxed text-muted">
            The AI picks what you study next — based on prerequisites and your current mastery. No need to scroll through 130+ topics.
          </p>
          <StudyQueue plan={home.plan} onOpen={openLesson} />
        </Section>

        {/* Quick Tools */}
        <Section title="Quick Tools">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {([
              { href: "/chat", label: "Ask a Doubt", sub: "AI tutor, instant help",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              { href: "/plan", label: "Full Roadmap", sub: "Your complete path",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
              { href: "/readiness", label: "Progress", sub: "Readiness & analytics",
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
            ] as const).map((tool) => (
              <Link key={tool.href} href={tool.href}
                className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-all hover:border-ink hover:bg-hover">
                <div className="rounded-lg bg-hover p-2.5 text-muted group-hover:text-ink transition-colors">{tool.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-ink">{tool.label}</p>
                  <p className="text-[11px] text-muted">{tool.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>

      </div>
    </main>
  );
}
