import { useMemo, useState, type KeyboardEvent } from "react";
import { splitInlineOptions } from "@/lib/practiceContent";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import type { StudyPracticeQuestion } from "@/lib/api/study";
import type { AnsweredQuestion } from "./useStudySession";

const TYPE_LABEL: Record<string, string> = {
  conceptual: "Conceptual",
  numerical: "Numerical",
  numeric: "Numerical",
  integer: "Integer answer",
  mcq: "Multiple choice",
  mcq_single: "Multiple choice",
  single_correct: "Single correct",
  mcq_multi: "Multiple correct",
  multiple_correct: "Multiple correct — pick all that apply",
  worked_example: "Worked example",
};

interface PracticePaneProps {
  question: StudyPracticeQuestion;
  number: number;
  correct: number;
  attempted: number;
  difficulty: number;
  busy: boolean;
  /** Set once a multiple-choice answer is graded: the pane shows the result. */
  result?: AnsweredQuestion | null;
  /** Free-text answer (numerical / conceptual), graded by the tutor. */
  onSubmit: (answer: string) => void;
  /** Multiple-choice pick, graded instantly from the key. */
  onChoose: (labels: string[], positionOf: (label: string) => number) => void;
  onAsk: (text: string) => void;
}

const SECONDARY_BTN =
  "cursor-pointer rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50";

export default function PracticePane({
  question,
  number,
  correct,
  attempted,
  difficulty,
  busy,
  result,
  onSubmit,
  onChoose,
  onAsk,
}: PracticePaneProps) {
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  const typeLabel = question.question_type ? TYPE_LABEL[question.question_type] ?? null : null;
  // Past-paper questions store their options inline; each gets its own row.
  const parsed = useMemo(() => splitInlineOptions(question.question_text), [question.question_text]);
  const multi = question.question_type === "multiple_correct";
  const isMcq = Boolean(parsed);
  const graded = Boolean(result);
  const positionOf = (label: string) => (parsed ? parsed.options.findIndex((o) => o.label === label) + 1 : 0);

  const toggle = (label: string) => {
    if (graded || busy) return;
    setPicked((prev) => (multi ? (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]) : [label]));
  };

  const submitText = (e?: { preventDefault: () => void }) => {
    e?.preventDefault();
    const value = answer.trim();
    if (!value || busy) return;
    onSubmit(value);
    setAnswer("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitText();
    }
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="practice-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Practice</p>
          <h2 id="practice-heading" className="font-display text-xl font-semibold text-ink">
            Question {number}
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span title="Correct out of attempted">
            <span className="font-semibold text-ink tabular-nums">{correct}</span>/{attempted} correct
          </span>
          <span className="flex items-center gap-1" title={`Difficulty ${difficulty} of 5`}>
            <span className="sr-only">Difficulty {difficulty} of 5</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} aria-hidden className={`h-1.5 w-3 rounded-full ${n <= difficulty ? "bg-accent" : "bg-line"}`} />
            ))}
          </span>
        </div>
      </div>

      <article className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        {typeLabel && (
          <span className="mb-3 inline-block rounded-full bg-hover px-2.5 py-0.5 text-[11px] font-semibold text-ink-2">{typeLabel}</span>
        )}
        <div className="study-notes">
          <MathErrorBoundary content={parsed ? parsed.stem : question.question_text}>
            <MarkdownMath content={parsed ? parsed.stem : question.question_text} />
          </MathErrorBoundary>
        </div>

        {parsed && (
          <div className="mt-4 flex flex-col gap-2" role={multi ? "group" : "radiogroup"} aria-label="Options">
            {parsed.options.map((o, i) => {
              const pos = i + 1;
              const isPicked = graded ? result!.chosen.includes(pos) : picked.includes(o.label);
              const isKey = graded && result!.key.includes(pos);
              const wrongPick = graded && isPicked && !isKey;
              const tone = isKey
                ? "border-success bg-success/10"
                : wrongPick
                  ? "border-danger bg-danger/5"
                  : isPicked
                    ? "border-accent bg-accent-soft"
                    : graded
                      ? "border-line opacity-60"
                      : "border-line hover:border-accent/60 hover:bg-hover";
              return (
                <button
                  key={o.label}
                  type="button"
                  role={multi ? "checkbox" : "radio"}
                  aria-checked={isPicked}
                  aria-label={`Option ${o.label}${isKey ? ", correct answer" : wrongPick ? ", your answer, wrong" : ""}`}
                  disabled={busy || graded}
                  onClick={() => toggle(o.label)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${graded ? "cursor-default" : "cursor-pointer"} disabled:cursor-default ${tone}`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-xs font-bold ${multi ? "rounded-md" : "rounded-full"} ${
                      isKey ? "bg-success text-surface" : wrongPick ? "bg-danger text-surface" : isPicked ? "bg-accent text-accent-on" : "border border-line text-ink-2"
                    }`}
                    aria-hidden
                  >
                    {isKey ? "✓" : wrongPick ? "✗" : o.label}
                  </span>
                  <span className="study-notes min-w-0 flex-1 overflow-x-auto">
                    <MathErrorBoundary content={o.text}>
                      <MarkdownMath content={o.text} />
                    </MathErrorBoundary>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {question.source && <p className="mt-4 text-[11px] text-muted">Source: {question.source}</p>}
      </article>

      {graded ? (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3.5 ${result!.correct ? "border-success/40 bg-success/10" : "border-danger/30 bg-danger/5"}`}
        >
          <p className={`text-sm font-semibold ${result!.correct ? "text-success" : "text-danger"}`}>
            {result!.correct ? "✓ Correct!" : "✗ Not quite."}
          </p>
          <p className="mt-0.5 text-sm text-ink-2">
            {result!.correct
              ? "Nicely done. Want to see the full working, or move on?"
              : result!.key.length
                ? "The correct option is marked in green. Your tutor is walking through the solution in the chat."
                : "Your tutor has walked through the solution in the chat. Ask about anything that isn't clear."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {result!.correct && (
              <button type="button" disabled={busy} onClick={() => onAsk("Show me the worked solution for that question.")} className={SECONDARY_BTN}>
                Show solution
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => onAsk("Next question, please.")}
              className="cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next question →
            </button>
          </div>
        </div>
      ) : isMcq ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || picked.length === 0}
              onClick={() => onChoose(picked, positionOf)}
              className="cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("Can I get a hint for this question?")} className={SECONDARY_BTN}>
              Hint
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("I don't understand the question — what exactly is it asking?")} className={SECONDARY_BTN}>
              What&apos;s it asking?
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("Explain the concept behind this question — which idea applies and why?")} className={SECONDARY_BTN}>
              Explain the concept
            </button>
          </div>
          <p className="text-[11px] text-muted">
            {multi ? "Select every correct option, then Submit." : "Pick an option, then Submit."} You&apos;ll see right or wrong instantly. Hints and
            explanations don&apos;t count against you — any other doubt, type it in the chat.
          </p>
        </div>
      ) : (
        <form onSubmit={submitText} className="flex flex-col gap-2">
          <label htmlFor="practice-answer" className="text-xs font-semibold text-ink-2">
            Your answer
          </label>
          <textarea
            id="practice-answer"
            aria-label="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            disabled={busy}
            placeholder="A number with units, or your reasoning…"
            className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy || !answer.trim()}
              className="cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Check answer
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("Can I get a hint for this question?")} className={SECONDARY_BTN}>
              Hint
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("I don't understand the question — what exactly is it asking?")} className={SECONDARY_BTN}>
              What&apos;s it asking?
            </button>
            <button type="button" disabled={busy} onClick={() => onAsk("Explain the concept behind this question — which idea applies and why?")} className={SECONDARY_BTN}>
              Explain the concept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onAsk("I'm stuck — please show me the full solution.")}
              className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Show solution
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Enter to submit · Shift+Enter for a new line. Hints and explanations don&apos;t count against you; asking for the solution counts
            as an attempt. Any other doubt — type it in the chat.
          </p>
        </form>
      )}
    </section>
  );
}
