import Link from "next/link";
import MarkdownMath from "@/components/MarkdownMath";
import type { StudyState } from "@/lib/api/study";

const OUTCOME: Record<string, { label: string; tone: string; note: string }> = {
  mastered: {
    label: "Mastered",
    tone: "bg-success/12 text-success",
    note: "Saved to your record. Your tutor will build on this next time.",
  },
  needs_review: {
    label: "Needs review",
    tone: "bg-warning/15 text-ink-2",
    note: "A review has been scheduled in two days so this sticks.",
  },
  incomplete: {
    label: "Not finished",
    tone: "bg-hover text-ink-2",
    note: "No practice answered yet. Come back to try some questions.",
  },
};

export default function StudyResults({
  study,
  summary,
  readiness,
  delta,
  onPracticeAgain,
}: {
  study: StudyState;
  summary: string | null;
  readiness: number | null;
  delta: number | null;
  onPracticeAgain: () => void;
}) {
  const outcome = OUTCOME[study.outcome ?? "incomplete"] ?? OUTCOME.incomplete;
  const pct = study.questions_served ? Math.round((study.questions_correct / study.questions_served) * 100) : null;

  return (
    <section
      className="rounded-2xl border border-line bg-surface p-5 sm:p-7 shadow-[var(--shadow-card)]"
      aria-labelledby="results-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Session results</p>
          <h2 id="results-heading" className="mt-1 font-display text-2xl font-semibold text-ink">
            {study.concept_name}
          </h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${outcome.tone}`}>{outcome.label}</span>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-canvas px-4 py-3">
          <dt className="text-[11px] font-semibold text-muted">Correct</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {study.questions_correct}
            <span className="text-base text-muted">/{study.questions_served}</span>
          </dd>
          {pct != null && <dd className="text-[11px] text-muted">{pct}%</dd>}
        </div>
        <div className="rounded-xl bg-canvas px-4 py-3">
          <dt className="text-[11px] font-semibold text-muted">Difficulty reached</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {study.difficulty_level}
            <span className="text-base text-muted">/5</span>
          </dd>
        </div>
        <div className="rounded-xl bg-canvas px-4 py-3">
          <dt className="text-[11px] font-semibold text-muted">Readiness</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {readiness != null ? Math.round(readiness) : "–"}
            <span className="text-base text-muted">/100</span>
          </dd>
          {delta != null && Math.abs(delta) >= 0.5 && (
            <dd className={`text-[11px] font-semibold ${delta > 0 ? "text-success" : "text-danger"}`}>
              {delta > 0 ? "+" : ""}
              {Math.round(delta)} this session
            </dd>
          )}
        </div>
      </dl>

      {summary && (
        <div className="study-notes mt-6 border-t border-line pt-5">
          <MarkdownMath content={summary} />
        </div>
      )}

      <p className="mt-5 text-xs text-muted">{outcome.note}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90"
        >
          Study this again
        </button>
        <Link
          href="/study"
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-hover"
        >
          Pick another topic
        </Link>
      </div>
    </section>
  );
}
