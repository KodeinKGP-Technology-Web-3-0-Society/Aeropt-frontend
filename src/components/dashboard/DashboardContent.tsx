"use client";

import React, { useState } from "react";
import DashboardHeatmap from "@/components/dashboard/DashboardHeatmap";
import SandboxCardDeck from "@/components/study/SandboxCardDeck";
import { useDashboardState, type StudyIntent } from "./useDashboardState";

const STUDY_INTENTS: { id: StudyIntent; label: string; hint: string }[] = [
  { id: "learn", label: "Learn", hint: "New topic from scratch" },
  { id: "revise", label: "Revise", hint: "Quick recap" },
  { id: "practice", label: "Practice", hint: "Questions now" },
];

const SUBJECTS = [
  { id: "physics", label: "Physics" },
  { id: "chemistry", label: "Chemistry" },
  { id: "maths", label: "Maths" },
] as const;

/** Same PCM accents as progress charts (`DEFAULT_CHART_COLORS`). */
const SUBJECT_ACCENT: Record<(typeof SUBJECTS)[number]["id"], string> = {
  physics: "var(--physics)",
  chemistry: "var(--chemistry)",
  maths: "var(--maths)",
};

/** Placeholder until per-subject analytics are wired. */
const SUBJECT_METRICS: Record<(typeof SUBJECTS)[number]["id"], { accuracy: number; attempted: number }> = {
  physics: { accuracy: 0, attempted: 0 },
  chemistry: { accuracy: 0, attempted: 0 },
  maths: { accuracy: 0, attempted: 0 },
};

const TOPICS_BY_SUBJECT: Record<(typeof SUBJECTS)[number]["id"], string[]> = {
  physics: [
    "Kinematics",
    "Laws of Motion",
    "Work, Energy and Power",
    "Rotational Motion",
    "Gravitation",
    "Thermodynamics",
    "Oscillations and Waves",
    "Electrostatics",
    "Current Electricity",
    "Magnetism",
    "Ray Optics",
    "Modern Physics",
  ],
  chemistry: [
    "Atomic Structure",
    "Chemical Bonding",
    "Thermodynamics",
    "Equilibrium",
    "Electrochemistry",
    "Chemical Kinetics",
    "p-Block",
    "d-Block",
    "Coordination Compounds",
    "Hydrocarbons",
    "Organic Reaction Mechanisms",
    "Biomolecules",
  ],
  maths: [
    "Quadratic Equations",
    "Sequences and Series",
    "Trigonometry",
    "Straight Lines",
    "Circles",
    "Limits and Continuity",
    "Differentiation",
    "Integration",
    "Differential Equations",
    "Vectors",
    "3D Geometry",
    "Probability",
  ],
};

const SELECT_CLASS =
  "w-full bg-surface border border-line focus:border-accent text-sm text-ink rounded-xl px-3 py-2.5 outline-none transition-colors cursor-pointer min-h-11";

const STRENGTH_BRIEFING =
  "You're making solid progress in Kinematics. Today, we should sharpen your projectile motion problem-solving to bridge the gap into Work-Power-Energy.";

function SubjectGlyph({ id }: { id: string }) {
  if (id === "chemistry") {
    return (
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
        <path d="M13 4h6v8l6 11a5 5 0 01-4.4 7H11.4A5 5 0 017 23l6-11V4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "maths") {
    return (
      <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
        <path d="M6 22c4-12 16-12 20 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 10h4M20 10h4M10 8v4M22 8v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(60 16 16)" />
      <ellipse cx="16" cy="16" rx="12" ry="5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-60 16 16)" />
    </svg>
  );
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeekStreakDots({ dots, streakValue }: { dots?: boolean[]; streakValue: number }) {
  const todayIdx = (new Date().getDay() + 6) % 7;
  const week = dots && dots.length === 7 ? dots : Array.from({ length: 7 }, (_, i) => i < streakValue);
  return (
    <div className="flex gap-1.5" role="list" aria-label="Session days this week">
      {week.map((active, idx) => {
        const isToday = idx === todayIdx;
        const day = WEEKDAY_LABELS[idx];
        const status = isToday ? "today" : active ? "studied" : "missed";
        return (
          <span
            key={idx}
            role="listitem"
            title={`${day}: ${status}`}
            aria-label={`${day}: ${status}`}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-200 ${
              isToday
                ? "bg-accent ring-2 ring-accent/35 ring-offset-1 ring-offset-canvas"
                : active
                  ? "bg-accent/55"
                  : "border border-dashed border-line bg-transparent"
            }`}
          />
        );
      })}
    </div>
  );
}

export default function DashboardContent() {
  const {
    router,
    loading,
    error,
    fetchDashboard,
    currentNode,
    readiness,
    coachBriefing,
    sandboxQueue,
    sandboxLoading,
    firstName,
    jeeDays,
    primaryLabel,
    proficiencyStat,
    weakStat,
    streakStat,
    weakN,
    streakN,
    overviewEmpty,
    continueLearning,
    openConceptChat,
    startCustomSession,
    startQuickPrompt,
  } = useDashboardState();

  const [studyIntent, setStudyIntent] = useState<StudyIntent | "">("");
  const [studySubject, setStudySubject] = useState<"" | (typeof SUBJECTS)[number]["id"]>("");
  const [studyTopic, setStudyTopic] = useState("");
  const [showStrengthBriefing, setShowStrengthBriefing] = useState(false);

  const subjectsEmpty = SUBJECTS.every((s) => SUBJECT_METRICS[s.id].attempted === 0);
  const topicOptions = studySubject ? TOPICS_BY_SUBJECT[studySubject] : [];
  const canPromptAgent = Boolean(studyIntent && studySubject && studyTopic);

  const handlePromptAgent = () => {
    if (!studyIntent || !studySubject || !studyTopic) return;
    const subjectLabel = SUBJECTS.find((s) => s.id === studySubject)?.label ?? studySubject;
    startCustomSession(studyIntent, subjectLabel, studyTopic);
  };

  if (loading) {
    return (
      <div
        className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pb-8 overflow-y-auto animate-pulse"
        role="status"
        aria-busy="true"
        aria-label="Loading your dashboard"
      >
        <div className="h-40 rounded-3xl bg-hover mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-hover" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pb-8 overflow-y-auto flex items-center justify-center">
        <div className="bg-surface border border-red-900/30 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <h3 className="text-base font-bold text-ink mb-2">Failed to load dashboard</h3>
          <p className="text-sm text-muted mb-5">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="inline-flex items-center min-h-11 px-5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-20 sm:px-5 lg:px-6">
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Today</p>
              <span className="text-xs tabular-nums text-muted">{jeeDays}d to JEE Main</span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {firstName}, pick up where you left off
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {currentNode
                ? `Resume ${currentNode.concept_name} in ${currentNode.chapter}.`
                : "Learn, revise, or drill — the agent takes it from here."}
              {readiness !== null ? ` Readiness ${readiness}%.` : ""}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={continueLearning}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-on transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97]"
            >
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={() => router.push("/roadmap")}
              className="inline-flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-accent active:scale-[0.97]"
            >
              View roadmap
            </button>
          </div>
        </section>
        <div className="lg:col-span-7">
          <SandboxCardDeck queue={sandboxQueue} loading={sandboxLoading} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {SUBJECTS.map((subject, i) => {
          const metrics = SUBJECT_METRICS[subject.id];
          const empty = metrics.attempted === 0;
          return (
            <article
              key={subject.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="dash-stagger-in relative overflow-hidden rounded-xl border border-line bg-surface px-3 py-3 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30"
            >
              <span
                className="absolute inset-y-2.5 left-0 w-[3px] rounded-full"
                style={{ background: SUBJECT_ACCENT[subject.id] }}
                aria-hidden="true"
              />
              <div className="pl-2">
                <div className="flex items-center gap-1.5 text-ink-2">
                  <SubjectGlyph id={subject.id} />
                  <h2 className="text-[11px] font-semibold uppercase tracking-wider">{subject.label}</h2>
                </div>
                {empty ? (
                  <button
                    type="button"
                    onClick={() =>
                      startQuickPrompt(`Teach me a short ${subject.label} warm-up from the basics.`, "theory")
                    }
                    className="mt-2 cursor-pointer text-left text-xs leading-relaxed text-accent transition-[color,transform] duration-150 hover:underline active:scale-[0.97]"
                  >
                    Start a warm-up
                  </button>
                ) : (
                  <p className="mt-2 text-lg font-semibold tabular-nums text-ink">
                    {metrics.accuracy}%
                    <span className="ml-1 text-[11px] font-medium text-muted">{metrics.attempted} Q</span>
                  </p>
                )}
              </div>
            </article>
          );
        })}
        <article
          style={{ animationDelay: `${SUBJECTS.length * 40}ms` }}
          className="dash-stagger-in rounded-xl border border-line bg-surface px-3 py-3 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Proficiency</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-ink">
            {overviewEmpty && subjectsEmpty ? "—" : (proficiencyStat?.value ?? "0%")}
          </p>
        </article>
        <article
          style={{ animationDelay: `${(SUBJECTS.length + 1) * 40}ms` }}
          className="dash-stagger-in rounded-xl border border-line bg-surface px-3 py-3 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Flagged weak</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-ink">
            {overviewEmpty && subjectsEmpty ? "—" : weakN}
          </p>
        </article>
        <article
          style={{ animationDelay: `${(SUBJECTS.length + 2) * 40}ms` }}
          className="dash-stagger-in rounded-xl border border-line bg-surface px-3 py-3 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/30"
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Streak</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums text-ink">
            {streakN}
            <span className="ml-1 text-[11px] font-medium text-muted">days</span>
          </p>
          <div className="mt-2">
            <WeekStreakDots dots={streakStat?.dots} streakValue={streakN} />
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardHeatmap onOpenConcept={openConceptChat} />
        </div>
        <div className="flex flex-col gap-3 xl:col-span-4">
          <section className="flex-1 rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Custom session</h2>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {STUDY_INTENTS.map((intent) => {
                const active = studyIntent === intent.id;
                return (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => setStudyIntent(intent.id)}
                    className={`min-h-14 cursor-pointer rounded-lg border px-2 py-1.5 text-left transition-[transform,border-color,background-color] duration-150 ease-out active:scale-[0.97] ${
                      active
                        ? "border-accent bg-accent-soft text-ink"
                        : "border-line text-muted hover:border-accent/40"
                    }`}
                  >
                    <span className="block text-[11px] font-bold uppercase tracking-wider">{intent.label}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">{intent.hint}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <label className="sr-only" htmlFor="study-subject">Subject</label>
              <select
                id="study-subject"
                value={studySubject}
                onChange={(e) => {
                  setStudySubject(e.target.value as "" | (typeof SUBJECTS)[number]["id"]);
                  setStudyTopic("");
                }}
                className={SELECT_CLASS}
              >
                <option value="">Choose subject</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.label}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="study-topic">Topic</label>
              <select
                id="study-topic"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                disabled={!studySubject}
                className={`${SELECT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <option value="">{studySubject ? "Choose topic" : "Pick a subject first"}</option>
                {topicOptions.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handlePromptAgent}
                disabled={!canPromptAgent}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-accent text-xs font-semibold uppercase tracking-wider text-accent-on transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start session
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-accent-soft p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Coach note</p>
            {weakStat?.list && weakStat.list.length > 0 && !showStrengthBriefing ? (
              <div className="mt-2">
                <p className="text-sm leading-relaxed text-ink-2">
                  Focus next on {weakStat.list[0]}
                  {weakStat.list.length > 1 ? ` (also ${weakStat.list[1]})` : ""}.
                </p>
                <button
                  type="button"
                  onClick={() => openConceptChat(weakStat.list![0], true)}
                  className="mt-2 cursor-pointer text-sm font-semibold text-accent transition-transform duration-150 hover:underline active:scale-[0.97]"
                >
                  Practise {weakStat.list[0]}
                </button>
              </div>
            ) : !showStrengthBriefing ? (
              <div className="mt-2">
                <p className="text-sm leading-relaxed text-ink-2">
                  {coachBriefing ?? "A short read on where you stand today."}
                </p>
                <button
                  type="button"
                  onClick={() => setShowStrengthBriefing(true)}
                  className="mt-2 cursor-pointer text-sm font-semibold text-accent transition-transform duration-150 hover:underline active:scale-[0.97]"
                >
                  Check your strength
                </button>
              </div>
            ) : (
              <p
                role="status"
                className="mt-2 text-sm leading-relaxed text-ink-2 motion-safe:[animation:strengthMorph_480ms_cubic-bezier(0.22,1,0.36,1)_both]"
              >
                {coachBriefing ?? STRENGTH_BRIEFING}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
