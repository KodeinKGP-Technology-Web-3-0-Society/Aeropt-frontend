"use client";

import MarkdownMath from "@/components/MarkdownMath";

type PracticeAttemptViewProps = {
  question: string;
  remainder: string;
  /** While true, solution stays collapsed so the question stays in focus. */
  hideSolution: boolean;
};

export default function PracticeAttemptView({
  question,
  remainder,
  hideSolution,
}: PracticeAttemptViewProps) {
  return (
    <div className="practice-attempt">
      <section className="practice-question-card">
        <p className="practice-question-label">Practice question</p>
        <MarkdownMath content={question} className="markdown-math practice-question-body" />
      </section>

      {remainder ? (
        hideSolution ? (
          <details className="practice-solution-reveal">
            <summary>Reveal solution (try the question first)</summary>
            <div className="practice-solution-body">
              <MarkdownMath content={remainder} className="markdown-math" />
            </div>
          </details>
        ) : (
          <section className="practice-solution-body">
            <MarkdownMath content={remainder} className="markdown-math" />
          </section>
        )
      ) : null}
    </div>
  );
}
