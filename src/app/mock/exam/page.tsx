"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import * as auth from "@/lib/api/auth";
import MarkdownMath from "@/components/MarkdownMath";
import {
  fetchMockStatus,
  mockUserId,
  startMockTest,
  submitAnswer,
  submitMockTest,
  type MockTestQuestion,
  type MockStartResult,
  type SavedAnswer,
} from "@/lib/api/mockTest";

// ── Icons ─────────────────────────────────────────────────────────────────────

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Answer =
  | { type: "choice"; values: string[] }
  | { type: "numeric"; value: string };

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SUBJECT_DOT: Record<string, string> = {
  Physics: "bg-physics",
  Chemistry: "bg-chemistry",
  Mathematics: "bg-maths",
};

function subjectDot(s: string) {
  return SUBJECT_DOT[s] ?? "bg-muted";
}

// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionView({
  question,
  answer,
  onAnswer,
}: {
  question: MockTestQuestion;
  answer: Answer | null;
  onAnswer: (a: Answer) => void;
}) {
  const hasOptions = !!question.options && question.options.length > 0;
  const qt = String(question.question_type ?? "").toLowerCase();
  const isMulti = qt === "multiple_correct" || qt === "multi_correct";
  // Anything that is not a numeric type but has no options would otherwise render no input at all.
  const isNumeric = ["numeric", "numerical", "integer"].includes(qt) || !hasOptions;
  const choiceValues = answer?.type === "choice" ? answer.values : [];
  const numericValue = answer?.type === "numeric" ? answer.value : "";

  function toggleChoice(label: string) {
    if (isMulti) {
      const next = choiceValues.includes(label)
        ? choiceValues.filter((v) => v !== label)
        : [...choiceValues, label];
      onAnswer({ type: "choice", values: next });
    } else {
      onAnswer({ type: "choice", values: [label] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${subjectDot(question.section)}`} />
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {question.section}
        </span>
        <span className="text-[11px] text-muted">·</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {question.chapter_title}
        </span>
        <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-muted">
          {qt.replace(/_/g, " ")}
        </span>
      </div>

      {/* Stem */}
      <MarkdownMath content={question.stem} className="markdown-math text-[16px] leading-7 text-ink" />

      {/* Answer input */}
      {isNumeric ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="mock-numeric-answer" className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Your answer
          </label>
          <input
            id="mock-numeric-answer"
            type="number"
            step="any"
            value={numericValue}
            onChange={(e) => onAnswer({ type: "numeric", value: e.target.value })}
            placeholder="Enter numeric value"
            className="w-48 rounded-xl border border-line bg-surface px-4 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      ) : hasOptions && question.options ? (
        <div className="flex flex-col gap-2">
          {isMulti && (
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Select all correct options
            </p>
          )}
          {question.options.map((opt) => {
            const selected = choiceValues.includes(opt.label);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => toggleChoice(opt.label)}
                className={[
                  "flex items-start gap-4 rounded-xl border px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  selected
                    ? "border-accent/40 bg-accent/5"
                    : "border-line bg-canvas hover:border-accent/30 hover:bg-hover",
                ].join(" ")}
              >
                <span
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[12px] font-bold",
                    isMulti ? "rounded border" : "rounded-full border",
                    selected ? "border-accent bg-accent text-white" : "border-line bg-surface text-muted",
                  ].join(" ")}
                >
                  {opt.label}
                </span>
                <span className="min-w-0 text-[14px] leading-6 text-ink"><MarkdownMath content={opt.text} className="markdown-math" /></span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ── Question palette ──────────────────────────────────────────────────────────

function QuestionPalette({
  questions,
  answers,
  current,
  onJump,
}: {
  questions: MockTestQuestion[];
  answers: Record<string, Answer>;
  current: number;
  onJump: (i: number) => void;
}) {
  // Group by section
  const sections = [...new Set(questions.map((q) => q.section))];

  return (
    <div className="flex flex-col gap-4 p-4">
      {sections.map((section) => {
        const sectionQs = questions.filter((q) => q.section === section);
        return (
          <div key={section}>
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${subjectDot(section)}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{section}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sectionQs.map((q) => {
                const globalIdx = questions.indexOf(q);
                const isCurrent = globalIdx === current;
                const isDone = isAnswered(answers[q.content_id]);
                return (
                  <button
                    key={q.content_id}
                    type="button"
                    onClick={() => onJump(globalIdx)}
                    title={`Q${q.display_order}`}
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-semibold transition-colors duration-150",
                      isCurrent
                        ? "bg-ink text-white"
                        : isDone
                          ? "border border-accent/40 bg-accent/10 text-accent"
                          : "border border-line bg-canvas text-muted hover:bg-hover",
                    ].join(" ")}
                  >
                    {q.display_order}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Submit confirm dialog ─────────────────────────────────────────────────────

function SubmitDialog({
  attempted,
  total,
  onConfirm,
  onCancel,
  submitting,
}: {
  attempted: number;
  total: number;
  onConfirm: () => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const unattempted = total - attempted;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-[18px] font-semibold text-ink">Submit test?</h2>
        <p className="mt-2 text-[14px] leading-6 text-muted">
          You have attempted <strong className="text-ink">{attempted}</strong> of{" "}
          <strong className="text-ink">{total}</strong> questions.
          {unattempted > 0 && (
            <> <span className="text-warning font-medium">{unattempted} unattempted</span> question{unattempted !== 1 ? "s" : ""} will be marked as not attempted.</>
          )}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 rounded-xl bg-ink py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-xl border border-line bg-canvas py-2.5 text-[14px] font-medium text-ink hover:bg-hover"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main exam page ────────────────────────────────────────────────────────────

// ── Local backup: the first start time (so a reload cannot reset the clock) and answers ──

type Backup = { startedAt?: string; answers?: Record<string, Answer> };

function backupKey(id: string) {
  return `mock:${id}`;
}

function readBackup(id: string): Backup {
  try {
    return JSON.parse(localStorage.getItem(backupKey(id)) || "{}") as Backup;
  } catch {
    return {};
  }
}

function writeBackup(id: string, patch: Backup) {
  try {
    localStorage.setItem(backupKey(id), JSON.stringify({ ...readBackup(id), ...patch }));
  } catch {
    /* private mode / quota: the server copy still exists */
  }
}

function fromSaved(list: MockStartResult["answers"]): Record<string, Answer> {
  const out: Record<string, Answer> = {};
  const rows: SavedAnswer[] = Array.isArray(list)
    ? list
    : Object.entries(list ?? {}).map(([content_id, v]) => ({ ...v, content_id }));
  for (const r of rows) {
    if (!r.content_id) continue;
    if (r.choice && r.choice.length) out[r.content_id] = { type: "choice", values: r.choice };
    else if (r.numeric_value != null) out[r.content_id] = { type: "numeric", value: String(r.numeric_value) };
  }
  return out;
}

function toRequest(userId: string, mockTestId: string, contentId: string, a: Answer, timeTaken?: number) {
  return {
    user_id: userId,
    mock_test_id: mockTestId,
    content_id: contentId,
    time_taken_sec: timeTaken,
    ...(a.type === "choice"
      ? { choice: a.values, student_answer: a.values.join(",") }
      : {
          numeric_value: a.value.trim() !== "" && Number.isFinite(parseFloat(a.value)) ? parseFloat(a.value) : null,
          student_answer: a.value,
        }),
  };
}

function isAnswered(a: Answer | undefined): boolean {
  if (!a) return false;
  return a.type === "choice" ? a.values.length > 0 : a.value.trim() !== "";
}

function Notice({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4">
      <p role="alert" className="max-w-sm rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-center text-[15px] leading-6 text-danger">
        {message}
      </p>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

const noticeBtn =
  "rounded-xl border border-line bg-surface px-5 py-2.5 text-[14px] font-medium text-ink hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function ExamRoom() {
  const router = useRouter();
  const params = useSearchParams();
  const rawId = params.get("id") ?? "";
  const mockTestId = rawId.replace(/^[{\s"']+|[}\s"']+$/g, "").trim();
  const userId = mockUserId();

  const [loading, setLoading] = useState(true);
  const [buildProgress, setBuildProgress] = useState<{
    ready: boolean;
    total: number;
    readyCount: number;
  } | null>(null);
  const [error, setError] = useState<{ message: string; retry: boolean } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [timeLimitSec, setTimeLimitSec] = useState(180 * 60);
  const [secondsLeft, setSecondsLeft] = useState(180 * 60);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [unsaved, setUnsaved] = useState(0);

  const deadlineRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  const failedRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const questionStartRef = useRef(0);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Per-question timer restarts whenever the student lands on a question.
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [current]);

  // Load and start. Idempotent: a reload resumes the same test.
  useEffect(() => {
    if (!mockTestId) {
      setError({ message: "No test selected. Choose one from Your mock tests, or build a new one.", retry: false });
      setLoading(false);
      return;
    }
    let live = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadTest() {
      try {
        const st = await fetchMockStatus(mockTestId, userId).catch(() => null);
        if (!live) return;

        if (st && st.status === "building") {
          setBuildProgress({
            ready: false,
            total: st.total || 30,
            readyCount: st.prepared || 0,
          });
          setLoading(false);
          pollTimer = setTimeout(loadTest, 800);
          return;
        }

        setBuildProgress(null);
        setLoading(true);
        const r = await startMockTest(userId, mockTestId);
        if (!live) return;

        const qs = Array.isArray(r.questions) ? r.questions : [];
        if (qs.length === 0) {
          setError({ message: "This test has no questions. Build a new one.", retry: false });
          setLoading(false);
          return;
        }
        const secs = (r.time_limit_minutes || 180) * 60;
        const saved = readBackup(mockTestId);
        const firstStart = saved.startedAt || r.started_at || new Date().toISOString();
        writeBackup(mockTestId, { startedAt: firstStart });
        const t0 = new Date(firstStart).getTime();
        const deadline = Number.isFinite(t0) ? t0 + secs * 1000 : Date.now() + secs * 1000;
        deadlineRef.current = deadline;
        const restored = { ...(saved.answers ?? {}), ...fromSaved(r.answers) };
        const known = new Set(qs.map((q) => q.content_id));
        const kept: Record<string, Answer> = {};
        for (const [k, v] of Object.entries(restored)) if (known.has(k) && isAnswered(v)) kept[k] = v;
        setQuestions([...qs].sort((a, b) => a.display_order - b.display_order));
        setAnswers(kept);
        setTimeLimitSec(secs);
        setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        for (const k of Object.keys(kept)) failedRef.current.add(k);
        setLoading(false);
      } catch (e: unknown) {
        if (!live) return;
        const status = e instanceof auth.ApiError ? e.status : undefined;
        const msg = e instanceof Error ? e.message : "Could not start the test.";
        if (status === 409 && /submitted|graded/i.test(msg)) {
          router.replace(`/mock/result/${encodeURIComponent(mockTestId)}`);
          return;
        }
        if (status === 409 && /still being built/i.test(msg)) {
          setBuildProgress((prev) => prev ?? { ready: false, total: 30, readyCount: 0 });
          setLoading(false);
          pollTimer = setTimeout(loadTest, 800);
          return;
        }
        if (status === 404) {
          setError({ message: "We could not find that test. It may belong to another account.", retry: false });
        } else {
          setError({ message: msg, retry: true });
        }
        setLoading(false);
      }
    }

    loadTest();

    return () => {
      live = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [mockTestId, userId, attempt, router]);

  // Save one answer; failures are remembered and re-sent at submit.
  const persist = useCallback(
    async (contentId: string, a: Answer, timeTaken?: number) => {
      try {
        await submitAnswer(toRequest(userId, mockTestId, contentId, a, timeTaken));
        failedRef.current.delete(contentId);
      } catch {
        failedRef.current.add(contentId);
      }
      setUnsaved(failedRef.current.size);
    },
    [userId, mockTestId],
  );

  const flushAll = useCallback(async () => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    const cur = answersRef.current;
    const ids = new Set<string>(failedRef.current);
    await Promise.all(
      [...ids].filter((id) => cur[id]).map((id) => persist(id, cur[id]!)),
    );
  }, [persist]);

  function handleAnswer(a: Answer) {
    const q = questions[current];
    if (!q) return;
    const next = { ...answersRef.current, [q.content_id]: a };
    answersRef.current = next;
    setAnswers(next);
    writeBackup(mockTestId, { answers: next });
    failedRef.current.add(q.content_id); // cleared once the server confirms
    clearTimeout(timers.current[q.content_id]);
    const timeTaken = Math.round((Date.now() - questionStartRef.current) / 1000);
    // Choices save at once; typed numbers wait for a pause so requests cannot land out of order.
    timers.current[q.content_id] = setTimeout(() => void persist(q.content_id, a, timeTaken), a.type === "choice" ? 0 : 600);
  }

  function handleNav(dir: -1 | 1) {
    setCurrent((c) => Math.max(0, Math.min(questions.length - 1, c + dir)));
  }

  function handleJump(i: number) {
    setCurrent(i);
    setShowPalette(false);
  }

  const handleSubmitConfirm = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowSubmit(false);
    setSubmitError(null);
    try {
      await flushAll();
      await submitMockTest(userId, mockTestId);
      try {
        localStorage.removeItem(backupKey(mockTestId));
      } catch {
        /* ignore */
      }
      router.push(`/mock/result/${encodeURIComponent(mockTestId)}`);
    } catch (e: unknown) {
      submittedRef.current = false;
      setSubmitError(e instanceof Error ? e.message : "Submission failed. Try again.");
      setSubmitting(false);
    }
  }, [flushAll, userId, mockTestId, router]);

  // Countdown from an absolute deadline (survives throttled tabs and reloads).
  useEffect(() => {
    if (loading || error) return;
    const id = setInterval(() => {
      if (deadlineRef.current == null) return;
      setSecondsLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [loading, error]);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (!loading && !error && questions.length > 0 && secondsLeft <= 0) void handleSubmitConfirm();
  }, [secondsLeft, loading, error, questions.length, handleSubmitConfirm]);

  const q = questions[current];
  const sections = [...new Set(questions.map((x) => x.section))];
  const attempted = Object.values(answers).filter(isAnswered).length;
  const pct = timeLimitSec > 0 ? (secondsLeft / timeLimitSec) * 100 : 0;
  const timerDanger = secondsLeft < 300; // < 5 min

  if (buildProgress && !buildProgress.ready) {
    const total = buildProgress.total || 30;
    const count = buildProgress.readyCount || 0;
    const progressPct = Math.min(100, Math.round((count / total) * 100));

    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
              </svg>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Assembling Your Test</h2>
              <p className="text-[12px] text-muted">
                {count > 0 ? `Preparing question ${count} of ${total}…` : "Selecting verified PYQs on server…"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-hover">
              <div
                className="h-full bg-accent transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted font-medium">
              <span>{progressPct}% compiled</span>
              <span>{count} / {total} questions</span>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-line/60 bg-canvas p-3 text-[12px] leading-relaxed text-muted">
            <span className="font-semibold text-ink">Background generation active:</span> The server continues compiling questions even if you close this tab. You can safely return anytime.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3 text-muted">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
          </svg>
          <span role="status" className="text-[14px]">Loading your test…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Notice message={error.message}>
        {error.retry && (
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className={noticeBtn}>
            Try again
          </button>
        )}
        <button type="button" onClick={() => router.push("/mock")} className={noticeBtn}>
          Back to mock tests
        </button>
      </Notice>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-surface px-4 py-3 shadow-[var(--shadow-nav)]">
        {/* Left: title + question count */}
        <div className="flex items-center gap-3">
          <span className="hidden text-[14px] font-semibold text-ink sm:block">Mock Test</span>
          <span className="text-[13px] text-muted">
            Q{(q?.display_order ?? current + 1)} / {questions.length}
          </span>
          <span className="text-[13px] text-muted hidden sm:block">
            · {attempted} of {questions.length} answered
          </span>
        </div>

        {/* Center: timer */}
        <div className={[
          "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[14px] font-semibold tabular-nums",
          timerDanger
            ? "border-danger/30 bg-danger/5 text-danger"
            : "border-line bg-canvas text-ink",
        ].join(" ")}>
          <ClockIcon className="h-3.5 w-3.5" />
          {formatTime(secondsLeft)}
        </div>

        {/* Right: palette + submit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPalette((p) => !p)}
            className="rounded-xl border border-line bg-canvas px-3 py-1.5 text-[13px] font-medium text-ink hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setShowSubmit(true)}
            disabled={submitting}
            className="rounded-xl bg-ink px-3 py-1.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Submit
          </button>
        </div>
      </header>

      {/* Timer progress bar */}
      <div className="h-0.5 w-full bg-hover">
        <div
          className={`h-full transition-all duration-1000 ${timerDanger ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Section tabs */}
      {sections.length > 1 && (
        <nav aria-label="Sections" className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-surface px-4 py-2">
          {sections.map((sec) => {
            const qs = questions.filter((x) => x.section === sec);
            const done = qs.filter((x) => isAnswered(answers[x.content_id])).length;
            const on = q?.section === sec;
            return (
              <button
                key={sec}
                type="button"
                aria-current={on ? "true" : undefined}
                onClick={() => handleJump(questions.findIndex((x) => x.section === sec))}
                className={[
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  on ? "bg-ink text-ink-on" : "text-muted hover:bg-hover hover:text-ink",
                ].join(" ")}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${subjectDot(sec)}`} />
                {sec}
                <span className="tabular-nums opacity-70">{done}/{qs.length}</span>
              </button>
            );
          })}
        </nav>
      )}

      {(submitError || unsaved > 0) && (
        <div role="alert" className="shrink-0 border-b border-danger/20 bg-danger/5 px-4 py-2 text-center text-[13px] text-danger">
          {submitError ?? `${unsaved} answer${unsaved === 1 ? "" : "s"} not saved yet; they will be sent again when you submit.`}
          {submitError && (
            <button type="button" onClick={() => setShowSubmit(true)} className="ml-2 font-semibold underline">
              Retry submit
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8">
            {q ? (
              <QuestionView
                question={q}
                answer={answers[q.content_id] ?? null}
                onAnswer={handleAnswer}
              />
            ) : (
              <p className="text-muted">No question found.</p>
            )}
          </div>

          {/* Nav bar */}
          <div className="sticky bottom-0 border-t border-line bg-surface/90 backdrop-blur px-4 py-3">
            <div className="mx-auto flex max-w-3xl items-center justify-between">
              <button
                type="button"
                onClick={() => handleNav(-1)}
                disabled={current === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 py-2 text-[14px] font-medium text-ink hover:bg-hover disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </button>

              <span className="text-[13px] text-muted">
                {current + 1} of {questions.length}
              </span>

              <button
                type="button"
                onClick={() => handleNav(1)}
                disabled={current === questions.length - 1}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-4 py-2 text-[14px] font-medium text-ink hover:bg-hover disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Question palette sidebar (desktop) */}
        <aside
          className={[
            "hidden shrink-0 flex-col border-l border-line bg-surface transition-all duration-200 md:flex",
            showPalette ? "w-64 overflow-y-auto" : "w-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="border-b border-line px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
              Question palette
            </span>
          </div>
          <QuestionPalette
            questions={questions}
            answers={answers}
            current={current}
            onJump={handleJump}
          />
          <div className="border-t border-line px-4 py-3">
            <div className="flex items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-accent/40 bg-accent/10" /> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-ink" /> Current
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-line" /> Not visited
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile palette sheet */}
      {showPalette && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface">
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Questions</span>
              <button type="button" onClick={() => setShowPalette(false)} className="text-[13px] text-muted">Done</button>
            </div>
            <QuestionPalette
              questions={questions}
              answers={answers}
              current={current}
              onJump={handleJump}
            />
          </div>
        </div>
      )}

      {/* Submit dialog */}
      {showSubmit && (
        <SubmitDialog
          attempted={attempted}
          total={questions.length}
          onConfirm={handleSubmitConfirm}
          onCancel={() => setShowSubmit(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

export default function MockExamPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <Suspense fallback={<div className="flex h-dvh items-center justify-center bg-canvas"><span className="text-muted text-[14px]">Loading…</span></div>}>
        <ExamRoom />
      </Suspense>
    </AuthGuard>
  );
}
