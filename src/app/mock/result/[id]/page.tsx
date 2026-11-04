"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { AppPage, AppShell } from "@/components/AppPage";
import StudySidebar from "@/components/study/StudySidebar";
import * as auth from "@/lib/api/auth";
import Link from "next/link";
import {
  fetchMockResult,
  mockUserId,
  type MockTestResult,
  type GradedQuestion,
  type SubjectScore,
} from "@/lib/api/mockTest";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number | null | undefined, dec = 1): string {
  if (n == null) return "—";
  return `${n.toFixed(dec)}%`;
}

function score(r: number | null | undefined, m: number | null | undefined): string {
  if (r == null || m == null) return "—";
  return `${r} / ${m}`;
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

const SUBJECT_COLORS: Record<string, { dot: string; badge: string; bar: string }> = {
  Physics: { dot: "bg-physics", badge: "text-physics bg-physics/8 border-physics/20", bar: "bg-physics" },
  Chemistry: { dot: "bg-chemistry", badge: "text-chemistry bg-chemistry/8 border-chemistry/20", bar: "bg-chemistry" },
  Mathematics: { dot: "bg-maths", badge: "text-maths bg-maths/8 border-maths/20", bar: "bg-maths" },
};

function subjectColors(s: string) {
  return SUBJECT_COLORS[s] ?? { dot: "bg-muted", badge: "text-muted bg-hover border-line", bar: "bg-accent" };
}

const STATUS_STYLES: Record<string, string> = {
  correct: "border-success/30 bg-success/5 text-success",
  incorrect: "border-danger/30 bg-danger/5 text-danger",
  unattempted: "border-line bg-hover text-muted",
  ungradable: "border-warning/30 bg-warning/5 text-warning",
};

const STATUS_LABEL: Record<string, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
  unattempted: "Not attempted",
  ungradable: "Ungradable",
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1.5 text-[28px] font-semibold leading-none text-ink">{value}</p>
      {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

// ── Subject breakdown card ────────────────────────────────────────────────────

function SubjectCard({ subject, data }: { subject: string; data: SubjectScore }) {
  const c = subjectColors(subject);
  const fillPct = data.max_score > 0 ? Math.round((data.raw_score / data.max_score) * 100) : 0;
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
        <span className="text-[14px] font-semibold text-ink">{subject}</span>
        <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest ${c.badge}`}>
          {score(data.raw_score, data.max_score)}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-hover">
        <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${fillPct}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[18px] font-semibold text-ink">{data.questions_correct}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Correct</p>
        </div>
        <div>
          <p className="text-[18px] font-semibold text-ink">{data.questions_attempted - data.questions_correct}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Wrong</p>
        </div>
        <div>
          <p className="text-[18px] font-semibold text-ink">{data.questions_total - data.questions_attempted}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Skipped</p>
        </div>
      </div>
    </div>
  );
}

// ── Question review row ───────────────────────────────────────────────────────

function QuestionRow({ q, idx }: { q: GradedQuestion; idx: number }) {
  const [expanded, setExpanded] = useState(false);
  const status = q.grade_status ?? "unattempted";
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.unattempted;

  return (
    <div className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <span className="mt-0.5 shrink-0 text-[11px] font-bold text-muted">Q{idx + 1}</span>
        <span className="flex-1 text-[13px] leading-5 text-ink line-clamp-2">{q.stem}</span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${statusStyle}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
        {q.question_score != null && (
          <span className={`shrink-0 text-[13px] font-semibold tabular-nums ${q.is_correct ? "text-success" : q.grade_status === "incorrect" ? "text-danger" : "text-muted"}`}>
            {q.question_score > 0 ? "+" : ""}{q.question_score}
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <p className="mb-3 text-[13px] leading-6 text-ink whitespace-pre-wrap">{q.stem}</p>
          {q.options && q.options.length > 0 && (
            <div className="mb-3 flex flex-col gap-1.5">
              {q.options.map((opt) => {
                const isCorrect = q.answer_text?.includes(opt.label);
                const isStudentAnswer = q.student_answer?.includes(opt.label);
                return (
                  <div
                    key={opt.label}
                    className={[
                      "flex items-start gap-3 rounded-lg border px-3 py-2 text-[13px]",
                      isCorrect ? "border-success/30 bg-success/5" : "border-line bg-canvas",
                    ].join(" ")}
                  >
                    <span className="font-bold text-muted">{opt.label}.</span>
                    <span className="flex-1">{opt.text}</span>
                    {isCorrect && <span className="shrink-0 text-[10px] font-bold uppercase text-success">Answer</span>}
                    {isStudentAnswer && !isCorrect && <span className="shrink-0 text-[10px] font-bold uppercase text-danger">Your pick</span>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-[12px] text-muted">
            <span>Chapter: <strong className="text-ink">{q.chapter_title}</strong></span>
            <span>Concept: <strong className="text-ink">{q.concept_name}</strong></span>
            {q.student_answer && (
              <span>Your answer: <strong className="text-ink">{q.student_answer}</strong></span>
            )}
            {q.answer_text && (
              <span>Correct: <strong className="text-success">{q.answer_text}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main results page ─────────────────────────────────────────────────────────

function ResultsContent({ mockTestId }: { mockTestId: string }) {
  const router = useRouter();
  const userId = mockUserId();

  const [result, setResult] = useState<MockTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notSubmitted, setNotSubmitted] = useState(false);
  const [loadingDebrief, setLoadingDebrief] = useState(false);
  const [debriefText, setDebriefText] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchMockResult(mockTestId, userId, false)
      .then((r) => { if (live) setResult(r); })
      .catch((e: unknown) => {
        if (!live) return;
        const status = e instanceof auth.ApiError ? e.status : undefined;
        const msg = e instanceof Error ? e.message : "Could not load results.";
        if (status === 409 && /call \/mock\/submit|not yet submitted/i.test(msg)) {
          // Not finished: send the student back to the paper rather than a dead end.
          setNotSubmitted(true);
        } else if (status === 404) {
          setError("We could not find that test. It may belong to another account.");
        } else {
          setError(msg);
        }
      });
    return () => { live = false; };
  }, [mockTestId, userId]);

  async function handleLoadDebrief() {
    if (!userId || !result) return;
    setLoadingDebrief(true);
    try {
      const r = await fetchMockResult(mockTestId, userId, true);
      setDebriefText(r.debrief);
    } catch {
      // silent
    } finally {
      setLoadingDebrief(false);
    }
  }

  if (notSubmitted) {
    return (
      <AppPage title="Results">
        <div className="rounded-xl border border-line bg-surface px-5 py-4">
          <p className="text-[15px] text-ink">This test has not been submitted yet, so there is no score to show.</p>
          <Link
            href={`/mock/exam?id=${encodeURIComponent(mockTestId)}`}
            className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-ink px-5 text-[14px] font-semibold text-ink-on hover:opacity-90"
          >
            Continue the test
          </Link>
        </div>
      </AppPage>
    );
  }

  if (error) {
    return (
      <AppPage title="Results">
        <p role="alert" className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-[15px] text-danger">
          {error}
        </p>
        <Link href="/mock" className="text-[14px] font-semibold text-accent hover:underline">
          Back to mock tests
        </Link>
      </AppPage>
    );
  }

  if (!result) {
    return (
      <AppPage title="Results">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      </AppPage>
    );
  }

  const { overall, subject_scores, graded_questions } = result;
  const subjects = Object.keys(subject_scores);
  const timeTaken = result.started_at && result.submitted_at
    ? formatDuration(result.started_at, result.submitted_at)
    : "—";

  return (
    <AppPage
      headerId="result-top"
      title="Mock Test Results"
      lede={`${result.exam.replace("_", " ")} · ${result.time_limit_minutes} min`}
      actions={
        <button
          type="button"
          onClick={() => router.push("/mock")}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[14px] font-medium text-ink hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          New test
        </button>
      }
    >
      {/* Overview stats */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="mb-3 text-xl font-semibold leading-7 text-ink">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Score"
            value={score(overall.raw_score, overall.max_score)}
            sub={`${pct(overall.accuracy_pct)} accuracy`}
          />
          <StatCard
            label="Attempted"
            value={`${overall.questions_attempted} / ${overall.questions_total}`}
            sub={`${overall.questions_correct} correct`}
          />
          <StatCard
            label="Accuracy"
            value={pct(overall.accuracy_pct)}
            sub={`${overall.questions_total - overall.questions_attempted} skipped`}
          />
          <StatCard
            label="Time taken"
            value={timeTaken}
            sub={`Limit: ${result.time_limit_minutes} min`}
          />
        </div>
      </section>

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <section aria-labelledby="subjects-heading">
          <h2 id="subjects-heading" className="mb-3 text-xl font-semibold leading-7 text-ink">
            Subject breakdown
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <SubjectCard key={s} subject={s} data={subject_scores[s]} />
            ))}
          </div>
        </section>
      )}

      {/* AI Debrief */}
      <section aria-labelledby="debrief-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="debrief-heading" className="text-xl font-semibold leading-7 text-ink">
            AI debrief
          </h2>
          {!debriefText && !result.debrief && (
            <button
              type="button"
              onClick={handleLoadDebrief}
              disabled={loadingDebrief}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-hover disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {loadingDebrief ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                  </svg>
                  Generating…
                </>
              ) : (
                "Generate debrief"
              )}
            </button>
          )}
        </div>
        {(debriefText ?? result.debrief) ? (
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-[14px] leading-7 text-ink whitespace-pre-wrap">
              {debriefText ?? result.debrief}
            </p>
          </div>
        ) : !loadingDebrief ? (
          <p className="text-[14px] text-muted">
            Click &ldquo;Generate debrief&rdquo; to get an AI analysis of your performance.
          </p>
        ) : null}
      </section>

      {/* Question review */}
      <section aria-labelledby="review-heading">
        <h2 id="review-heading" className="mb-3 text-xl font-semibold leading-7 text-ink">
          Question review
        </h2>
        <div className="flex flex-col gap-2">
          {graded_questions.map((q, i) => (
            <QuestionRow key={q.content_id} q={q} idx={i} />
          ))}
        </div>
      </section>

      <a
        href="#result-top"
        className="inline-flex min-h-11 items-center self-start text-[15px] font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Back to top
      </a>
    </AppPage>
  );
}

export default function MockResultPage() {
  const params = useParams<{ id: string }>();
  const mockTestId = decodeURIComponent(params.id ?? "");

  return (
    <AuthGuard requireOnboarding={false}>
      <AppShell>
        <StudySidebar />
        <Suspense fallback={<div className="flex-1 bg-canvas" />}>
          <ResultsContent mockTestId={mockTestId} />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
