"use client";

import type { ReactNode } from "react";
import {
  type ClassroomMapItem,
  type ClassroomPlanItem,
  type ClassroomReadiness,
  type ClassroomReviseItem,
  type ClassroomToday,
  type PlanStatus,
  type ReadinessLabel,
  type TodayAction,
} from "@/lib/api/classroom";
import { useHomeState } from "./useHomeState";
import Link from "next/link";

function EmptyBlock({ name }: { name: string }) {
  return <p className="text-sm text-muted">Nothing in {name} yet.</p>;
}

function formatWhen(value: string): string {
  if (value === "today") return "Today";
  if (value === "this_week") return "This week";
  return value;
}

function formatAction(action: TodayAction): string {
  if (action === "lesson") return "Lesson";
  if (action === "revise") return "Revise";
  return "Assess";
}

function formatReadinessLabel(label: ReadinessLabel): string {
  if (label === "ready") return "Ready";
  if (label === "building") return "Building";
  return "Early";
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-6">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </section>
  );
}

function TodayBlock({
  today,
  actionPending,
  actionError,
  onOpen,
  onComplete,
  onDismiss,
}: {
  today: ClassroomToday | null;
  actionPending: boolean;
  actionError: string | null;
  onOpen: (today: ClassroomToday) => void;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  if (!today) return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-line bg-surface px-6 py-8 text-center shadow-sm">
      <h3 className="font-display text-xl font-semibold tracking-tight text-ink">You're all caught up!</h3>
      <p className="text-sm text-muted">You have no pending tasks for today. Try a quick practice session.</p>
    </div>
  );

  return (
    <div className="flex w-full flex-col gap-5 rounded-xl border border-line bg-surface px-6 py-6 text-left shadow-sm">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          {formatAction(today.action)}
          {today.provisional ? " · Provisional" : ""}
          {" · "}
          {today.minutes} min
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
          {today.title}
        </h3>
      </div>

      {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onOpen(today)}
          disabled={actionPending}
          className="cursor-pointer rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Start Session
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={actionPending}
          className="cursor-pointer rounded-lg border border-line bg-transparent px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Complete
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={actionPending}
          className="cursor-pointer rounded-lg border border-transparent bg-transparent px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ToolsBlock() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Link href="/plan" className="group flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-5 transition-all hover:border-ink hover:bg-hover">
        <div className="rounded-md bg-accent/10 p-2 text-accent group-hover:bg-accent/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">Study Plan</span>
          <span className="text-xs text-muted text-left">View your full roadmap</span>
        </div>
      </Link>
      <Link href="/practice" className="group flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-5 transition-all hover:border-ink hover:bg-hover">
        <div className="rounded-md bg-physics/10 p-2 text-physics group-hover:bg-physics/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">Quick Practice</span>
          <span className="text-xs text-muted text-left">Test your knowledge</span>
        </div>
      </Link>
      <Link href="/doubt" className="group flex flex-col items-start gap-3 rounded-xl border border-line bg-surface p-5 transition-all hover:border-ink hover:bg-hover">
        <div className="rounded-md bg-warning/10 p-2 text-warning group-hover:bg-warning/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink">Ask a Doubt</span>
          <span className="text-xs text-muted text-left">Get help from the AI tutor</span>
        </div>
      </Link>
    </div>
  );
}

function ProgressOverview({ map, readiness }: { map: ClassroomMapItem[], readiness: ClassroomReadiness }) {
  const total = map.length;
  const mastered = map.filter(i => i.mastery >= 65).length;
  const masteryPercentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Mastery Progress</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold tabular-nums text-ink">{masteryPercentage}%</span>
        </div>
        <p className="text-sm text-muted">{mastered} out of {total || 0} topics mastered</p>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Readiness Score</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-4xl font-semibold tabular-nums text-ink">{readiness.score}</span>
        </div>
        <p className="text-sm text-muted">Status: {formatReadinessLabel(readiness.label)}</p>
      </div>
    </div>
  );
}

function ReviseList({ revise }: { revise: ClassroomReviseItem[] }) {
  if (revise.length === 0) return <EmptyBlock name="Revision queue" />;

  return (
    <ul className="flex flex-col gap-2">
      {revise.map((item) => (
        <li key={`${item.concept_id}-${item.due}`} className="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-[11px] font-medium text-muted">Due {formatWhen(String(item.due))}</p>
          </div>
          <Link 
            href={`/lesson/${item.concept_id}`}
            className="flex-shrink-0 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Review
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function HomeContent() {
  const {
    home,
    loading,
    error,
    actionPending,
    actionError,
    reload,
    openToday,
    completeToday,
    dismissToday,
  } = useHomeState();

  if (loading) {
    return (
      <div
        className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto animate-pulse"
        role="status"
        aria-busy="true"
        aria-label="Loading home"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="h-32 rounded-xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
          <h3 className="mb-2 text-base font-bold text-ink">Failed to load home</h3>
          <p className="mb-6 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-ink/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-12 pt-[6.75rem] lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Welcome back</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your Dashboard
          </h1>
        </header>

        <section aria-labelledby="today-heading">
          <h2 id="today-heading" className="sr-only">
            Today
          </h2>
          <TodayBlock
            today={home.today}
            actionPending={actionPending}
            actionError={actionError}
            onOpen={openToday}
            onComplete={completeToday}
            onDismiss={dismissToday}
          />
        </section>

        <Section title="Quick Tools">
          <ToolsBlock />
        </Section>

        <Section title="Progress Overview">
          <ProgressOverview map={home.map} readiness={home.readiness} />
        </Section>

        {home.revise.length > 0 && (
          <Section title="Up Next for Revision">
            <ReviseList revise={home.revise.slice(0, 3)} />
          </Section>
        )}
      </div>
    </main>
  );
}
