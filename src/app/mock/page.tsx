"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { AppPage, AppShell } from "@/components/AppPage";
import StudySidebar from "@/components/study/StudySidebar";
import BuildProgress from "@/components/mock/BuildProgress";
import MockHistory from "@/components/mock/MockHistory";
import {
  fetchMockCatalog,
  buildMockTest,
  mockUserId,
  type CatalogChapter,
  type QuestionTypeGroup,
  type MockCatalog,
  type SubjectConfig,
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "text-physics bg-physics/8 border-physics/20",
  Chemistry: "text-chemistry bg-chemistry/8 border-chemistry/20",
  Mathematics: "text-maths bg-maths/8 border-maths/20",
};

const SUBJECT_DOT: Record<string, string> = {
  Physics: "bg-physics",
  Chemistry: "bg-chemistry",
  Mathematics: "bg-maths",
};

function subjectColor(s: string) {
  return SUBJECT_COLORS[s] ?? "text-ink bg-hover border-line";
}

function subjectDot(s: string) {
  return SUBJECT_DOT[s] ?? "bg-muted";
}

type ExamType = "JEE_ADVANCED" | "JEE_MAIN";

/** Standard paper shape per subject; the real count is capped by what the chosen chapters hold. */
const EXAM_DEFAULTS: Record<ExamType, { time: number; perSubject: number }> = {
  JEE_ADVANCED: { time: 180, perSubject: 18 },
  JEE_MAIN: { time: 180, perSubject: 25 },
};
const MAX_PER_SUBJECT = 40;

const QUESTION_TYPES: { id: QuestionTypeGroup; label: string; hint: string }[] = [
  { id: "single", label: "Single-correct MCQ", hint: "One option is right" },
  { id: "multiple", label: "Multiple-correct MCQ", hint: "One or more options" },
  { id: "numerical", label: "Numerical", hint: "Type the number" },
];

// ── Subject card: its chapters and how many questions to draw from them ───────

function SubjectCard({
  subject,
  chapters,
  selected,
  count,
  onToggle,
  onToggleAll,
  onCount,
}: {
  subject: string;
  chapters: CatalogChapter[];
  selected: Set<string>;
  count: number;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onCount: (n: number) => void;
}) {
  const available = chapters.filter((c) => selected.has(c.chapter_id)).reduce((n, c) => n + c.gradeable_pyqs, 0);
  const max = Math.min(MAX_PER_SUBJECT, available);
  const allSelected = chapters.length > 0 && chapters.every((c) => selected.has(c.chapter_id));

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 pt-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${subjectDot(subject)}`} />
          <h3 className="text-lg font-semibold text-ink">{subject}</h3>
          <span className="text-[13px] text-muted">
            {selected.size} of {chapters.length} chapters
          </span>
        </div>

        <div className="flex items-center gap-2" role="group" aria-label={`${subject} questions`}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Questions</span>
          <button
            type="button"
            onClick={() => onCount(count - 1)}
            disabled={count <= 1}
            aria-label={`Fewer ${subject} questions`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg text-ink hover:bg-hover disabled:opacity-40"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            value={max === 0 ? 0 : count}
            disabled={max === 0}
            aria-label={`${subject} question count`}
            onChange={(e) => onCount(Number(e.target.value))}
            className="h-9 w-14 rounded-lg border border-line bg-canvas text-center text-[16px] font-semibold tabular-nums text-ink focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
          <span className="text-[13px] text-muted">/ {max}</span>
          <button
            type="button"
            onClick={() => onCount(count + 1)}
            disabled={count >= max}
            aria-label={`More ${subject} questions`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg text-ink hover:bg-hover disabled:opacity-40"
          >
            +
          </button>
        </div>
      </header>

      <div className="mt-3 flex items-center justify-between px-5 text-[13px] text-muted">
        <span>{available > 0 ? `${available} PYQs in your chapters` : "Pick at least one chapter"}</span>
        <button type="button" onClick={onToggleAll} className="font-medium text-accent hover:underline">
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-5 pt-3">
        {chapters.map((ch) => {
          const on = selected.has(ch.chapter_id);
          return (
            <button
              key={ch.chapter_id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(ch.chapter_id)}
              className={[
                "flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                on ? "border-accent bg-accent text-white" : "border-line bg-canvas text-ink hover:bg-hover",
              ].join(" ")}
            >
              {on && <CheckIcon className="h-3 w-3" />}
              <span>{ch.title}</span>
              <span className={on ? "text-white/70" : "text-muted"}>{ch.gradeable_pyqs}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Main Setup Page ───────────────────────────────────────────────────────────

function MockSetup() {
  const router = useRouter();
  const userId = mockUserId();

  const [catalog, setCatalog] = useState<MockCatalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const [exam, setExam] = useState<ExamType>("JEE_ADVANCED");
  const [timeMinutes, setTimeMinutes] = useState(180);
  const [types, setTypes] = useState<QuestionTypeGroup[]>(["single", "multiple", "numerical"]);
  const lastExam = useRef<ExamType | null>(null);

  // subject → chapter ids chosen, and subject → how many questions to draw
  const [selectedChapters, setSelectedChapters] = useState<Record<string, Set<string>>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});

  const [building, setBuilding] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [requested, setRequested] = useState(0);

  useEffect(() => {
    let live = true;
    setCatalog(null);
    setCatalogError(null);
    // Changing the exam starts over; changing only the question types keeps your chapters and counts.
    const sameExam = lastExam.current === exam;
    fetchMockCatalog(userId, exam, undefined, types)
      .then((c) => {
        if (!live) return;
        lastExam.current = exam;
        setCatalog(c);
        setSelectedChapters((prev) => {
          const chosen: Record<string, Set<string>> = {};
          for (const subject of c.subjects) {
            const own = c.chapters.filter((ch) => ch.subject === subject).map((ch) => ch.chapter_id);
            chosen[subject] = sameExam && prev[subject] ? new Set(own.filter((id) => prev[subject]!.has(id))) : new Set(own);
          }
          return chosen;
        });
        setCounts((prev) => {
          const want: Record<string, number> = {};
          for (const subject of c.subjects) {
            const total = c.chapters.filter((ch) => ch.subject === subject).reduce((n, ch) => n + ch.gradeable_pyqs, 0);
            const wished = sameExam && prev[subject] ? prev[subject]! : EXAM_DEFAULTS[exam].perSubject;
            want[subject] = Math.min(wished, MAX_PER_SUBJECT, total);
          }
          return want;
        });
      })
      .catch((e: unknown) => {
        if (live) setCatalogError(e instanceof Error ? e.message : "Could not load the chapters");
      });
    return () => { live = false; };
  }, [userId, exam, types, reload]);

  useEffect(() => {
    setTimeMinutes(EXAM_DEFAULTS[exam].time);
  }, [exam]);

  const chaptersBySubject = useMemo(() => {
    const by: Record<string, CatalogChapter[]> = {};
    for (const s of catalog?.subjects ?? []) by[s] = (catalog?.chapters ?? []).filter((c) => c.subject === s);
    return by;
  }, [catalog]);

  const poolFor = useCallback(
    (subject: string, chosen: Set<string>) =>
      (chaptersBySubject[subject] ?? []).filter((c) => chosen.has(c.chapter_id)).reduce((n, c) => n + c.gradeable_pyqs, 0),
    [chaptersBySubject],
  );

  const setChosen = useCallback(
    (subject: string, chosen: Set<string>) => {
      setSelectedChapters((prev) => ({ ...prev, [subject]: chosen }));
      // The count can never exceed what the chosen chapters hold.
      setCounts((prev) => ({
        ...prev,
        [subject]: Math.min(prev[subject] ?? 0, MAX_PER_SUBJECT, poolFor(subject, chosen)),
      }));
    },
    [poolFor],
  );

  const toggleChapter = (subject: string, id: string) => {
    const next = new Set(selectedChapters[subject] ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChosen(subject, next);
  };

  const toggleAll = (subject: string) => {
    const own = chaptersBySubject[subject] ?? [];
    const all = own.every((c) => selectedChapters[subject]?.has(c.chapter_id));
    setChosen(subject, all ? new Set() : new Set(own.map((c) => c.chapter_id)));
    if (!all) {
      const total = own.reduce((n, c) => n + c.gradeable_pyqs, 0);
      setCounts((prev) => ({ ...prev, [subject]: Math.min(EXAM_DEFAULTS[exam].perSubject, MAX_PER_SUBJECT, total) }));
    }
  };

  const setCount = (subject: string, n: number) => {
    const max = Math.min(MAX_PER_SUBJECT, poolFor(subject, selectedChapters[subject] ?? new Set()));
    setCounts((prev) => ({ ...prev, [subject]: Math.max(1, Math.min(Number.isFinite(n) ? Math.round(n) : 1, max)) }));
  };

  const toggleType = (id: QuestionTypeGroup) =>
    setTypes((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id]));

  const active = (catalog?.subjects ?? []).filter((s) => (selectedChapters[s]?.size ?? 0) > 0 && (counts[s] ?? 0) > 0);
  const totalQuestions = active.reduce((n, s) => n + (counts[s] ?? 0), 0);

  async function handleBuild() {
    setBuildError(null);
    if (active.length === 0) {
      setBuildError("Pick at least one chapter to build a test.");
      return;
    }
    setBuilding(true);
    try {
      const subjects: SubjectConfig[] = active.map((s) => ({
        subject: s,
        chapters: Array.from(selectedChapters[s] ?? []),
        n_questions: counts[s] ?? 0,
        question_types: types,
      }));
      const result = await buildMockTest({
        user_id: userId,
        exam,
        subjects,
        total_time_minutes: timeMinutes,
        allow_fallback: true,
        async_build: true,
      });
      if (result.status === "built" || result.status === undefined) {
        // Older synchronous agent: the paper is already assembled.
        router.push(`/mock/exam?id=${encodeURIComponent(result.mock_test_id)}`);
        return;
      }
      setRequested(result.total_questions || totalQuestions);
      setBuildingId(result.mock_test_id);
    } catch (e: unknown) {
      setBuildError(e instanceof Error ? e.message : "Failed to build the test. Try again.");
    } finally {
      setBuilding(false);
    }
  }

  if (buildingId) {
    return (
      <AppPage headerId="mock-top" title="Mock Test" lede="Putting your paper together." busy>
        <BuildProgress
          mockTestId={buildingId}
          requestedTotal={requested}
          onBuilt={(id) => router.push(`/mock/exam?id=${encodeURIComponent(id)}`)}
          onCancel={() => setBuildingId(null)}
          onRetry={() => {
            setBuildingId(null);
            void handleBuild();
          }}
        />
      </AppPage>
    );
  }

  return (
    <AppPage
      headerId="mock-top"
      title="Mock Test"
      lede="A timed paper of real JEE PYQs from the chapters you choose."
    >
      <MockHistory />

      {/* Format + time */}
      <section aria-label="Format" className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="Exam">
          {(["JEE_ADVANCED", "JEE_MAIN"] as ExamType[]).map((e) => (
            <button
              key={e}
              type="button"
              aria-pressed={exam === e}
              onClick={() => setExam(e)}
              className={[
                "min-h-10 rounded-lg px-5 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                exam === e ? "bg-ink text-ink-on" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {e === "JEE_ADVANCED" ? "JEE Advanced" : "JEE Main"}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted">Duration</span>
          <div className="relative">
            <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="number"
              inputMode="numeric"
              min={30}
              max={360}
              step={5}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(Number(e.target.value))}
              className="w-36 rounded-xl border border-line bg-surface py-2.5 pl-9 pr-10 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted">min</span>
          </div>
        </label>
      </section>

      {/* Question types */}
      <section aria-label="Question types">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted">Question types</h2>
        <div className="flex flex-wrap gap-2">
          {QUESTION_TYPES.map((t) => {
            const on = types.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                title={t.hint}
                onClick={() => toggleType(t.id)}
                className={[
                  "flex min-h-10 items-center gap-1.5 rounded-xl border px-4 text-[14px] font-semibold transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  on ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:bg-hover",
                ].join(" ")}
              >
                {on && <CheckIcon className="h-3.5 w-3.5" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Subjects */}
      {catalogError ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
          <p className="text-base text-danger">{catalogError}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="mt-2 text-[14px] font-semibold text-accent hover:underline">
            Try again
          </button>
        </div>
      ) : !catalog ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {catalog.subjects.map((subject) => (
            <SubjectCard
              key={subject}
              subject={subject}
              chapters={chaptersBySubject[subject] ?? []}
              selected={selectedChapters[subject] ?? new Set()}
              count={counts[subject] ?? 0}
              onToggle={(id) => toggleChapter(subject, id)}
              onToggleAll={() => toggleAll(subject)}
              onCount={(n) => setCount(subject, n)}
            />
          ))}
        </div>
      )}

      {buildError && (
        <p role="alert" className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4 text-[15px] text-danger">
          {buildError}
        </p>
      )}

      {/* Summary + start: stays in reach while you scroll the chapters */}
      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-muted">
            <span className="font-semibold text-ink">{totalQuestions} questions</span>
            {" · "}
            {timeMinutes} min
            {" · "}
            {active.length} subject{active.length === 1 ? "" : "s"}
          </p>
          <button
            type="button"
            onClick={handleBuild}
            disabled={building || !catalog || totalQuestions === 0}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-[15px] font-semibold text-ink-on transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {building ? "Starting…" : "Start mock test →"}
          </button>
        </div>
      </div>
    </AppPage>
  );
}

export default function MockTestPage() {
  return (
    <AuthGuard requireOnboarding={false}>
      <AppShell>
        <StudySidebar />
        <Suspense fallback={<div className="flex-1 bg-canvas" />}>
          <MockSetup />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
