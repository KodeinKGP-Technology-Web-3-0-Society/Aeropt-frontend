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

function formatStatus(status: PlanStatus): string {
  if (status === "in_progress") return "In progress";
  if (status === "completed") return "Completed";
  if (status === "skipped") return "Skipped";
  return "Pending";
}

function formatReadinessLabel(label: ReadinessLabel): string {
  if (label === "ready") return "Ready";
  if (label === "building") return "Building";
  return "Early";
}

/** Semantic mastery band for the map number only — not brand decoration. */
function masteryTone(mastery: number): string {
  if (mastery >= 65) return "text-success";
  if (mastery >= 40) return "text-warning";
  return "text-danger";
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
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">{title}</h2>
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
  if (!today) return <EmptyBlock name="Today" />;

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-line bg-surface px-5 py-5 text-left shadow-[var(--shadow-card)]">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          {formatAction(today.action)}
          {today.provisional ? " · Provisional" : ""}
          {" · "}
          {today.minutes} min
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {today.title}
        </h3>
      </div>

      {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onOpen(today)}
          disabled={actionPending}
          className="cursor-pointer rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Start
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={actionPending}
          className="cursor-pointer rounded-full border border-line bg-transparent px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Complete
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={actionPending}
          className="cursor-pointer rounded-full border border-line bg-transparent px-3.5 py-2 text-xs font-semibold text-ink transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function PlanList({
  plan,
  onOpen,
}: {
  plan: ClassroomPlanItem[];
  onOpen: (conceptId: string) => void;
}) {
  if (plan.length === 0) return <EmptyBlock name="Study plan" />;

  return (
    <ul className="divide-y divide-line">
      {plan.map((item) => (
        <li key={`${item.concept_id}-${item.when}-${item.title}`}>
          <button
            type="button"
            onClick={() => onOpen(item.concept_id)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-muted">
                {formatWhen(String(item.when))} · {formatStatus(item.status)}
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MapList({
  map,
  onOpen,
}: {
  map: ClassroomMapItem[];
  onOpen: (conceptId: string) => void;
}) {
  if (map.length === 0) return <EmptyBlock name="Learning map" />;

  return (
    <ul className="divide-y divide-line">
      {map.map((item) => (
        <li key={item.concept_id}>
          <button
            type="button"
            onClick={() => onOpen(item.concept_id)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-hover/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/30"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{item.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">{item.chapter}</p>
            </div>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${masteryTone(item.mastery)}`}>
              {Math.round(item.mastery)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ReviseList({ revise }: { revise: ClassroomReviseItem[] }) {
  if (revise.length === 0) return <EmptyBlock name="Revision queue" />;

  return (
    <ul className="divide-y divide-line">
      {revise.map((item) => (
        <li key={`${item.concept_id}-${item.due}`} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{item.title}</p>
            <p className="mt-0.5 text-[11px] text-muted">Due {formatWhen(String(item.due))}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ReadinessBlock({ readiness }: { readiness: ClassroomReadiness }) {
  return (
    <div className="flex items-baseline gap-3">
      <p className="font-display text-3xl font-semibold tabular-nums text-ink">{readiness.score}</p>
      <p className="text-sm text-muted">{formatReadinessLabel(readiness.label)}</p>
    </div>
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
    openLesson,
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
          <div className="h-32 rounded-2xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
          <div className="h-24 rounded-xl bg-hover" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <h3 className="mb-2 text-base font-bold text-ink">Failed to load home</h3>
          <p className="mb-5 text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-accent-on hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-10 pt-[6.75rem] lg:px-8 lg:pb-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Home</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Today&apos;s classroom
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

        <Section title="Study plan">
          <PlanList plan={home.plan} onOpen={openLesson} />
        </Section>

        <Section title="Learning map">
          <MapList map={home.map} onOpen={openLesson} />
        </Section>

        <Section title="Revision queue">
          <ReviseList revise={home.revise} />
        </Section>

        <Section title="Readiness">
          <ReadinessBlock readiness={home.readiness} />
        </Section>
      </div>
    </main>
  );
}
