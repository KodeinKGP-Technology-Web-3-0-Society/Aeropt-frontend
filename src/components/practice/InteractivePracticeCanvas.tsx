"use client";

import { useEffect, useId, useState } from "react";
import MarkdownMath from "@/components/MarkdownMath";
import SandboxCanvas from "./SandboxCanvas";
import type { InteractivePracticeData } from "@/lib/practiceContent";

type InteractivePracticeCanvasProps = {
  data: InteractivePracticeData;
  remainder?: string;
  onGrade?: (outcome: "correct" | "incorrect") => void;
  gradingDisabled?: boolean;
};

export default function InteractivePracticeCanvas({
  data,
  remainder,
  onGrade,
  gradingDisabled,
}: InteractivePracticeCanvasProps) {
  const formId = useId();
  const [selectedOption, setSelectedOption] = useState("");
  const [numericalAnswer, setNumericalAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setSelectedOption("");
    setNumericalAnswer("");
    setIsSubmitted(false);
    setIsCorrect(null);
  }, [data.question_text, data.correct_answer]);

  const handleSubmit = () => {
    if (data.type === "mcq" && !selectedOption) return;
    if (data.type === "numerical" && !numericalAnswer.trim()) return;

    let correct = false;
    if (data.type === "mcq") {
      correct = selectedOption === data.correct_answer;
    } else {
      correct =
        String(numericalAnswer).trim().toLowerCase() ===
        String(data.correct_answer || "").trim().toLowerCase();
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    onGrade?.(correct ? "correct" : "incorrect");
  };

  const canSubmit =
    !isSubmitted &&
    !gradingDisabled &&
    (data.type === "mcq" ? Boolean(selectedOption) : Boolean(numericalAnswer.trim()));

  return (
    <article className="practice-canvas" aria-label="Practice question">
      <header className="practice-canvas__head">
        <p className="practice-canvas__kicker">Practice canvas</p>
        <h2 className="practice-canvas__title">Attempt the question here</h2>
        <span className="practice-canvas__badge">{data.difficulty}</span>
      </header>

      <div className="practice-canvas__prompt">
        <MarkdownMath content={data.question_text} className="markdown-math practice-canvas__math" />
      </div>

      <SandboxCanvas />

      {data.type === "mcq" && data.options && data.options.length > 0 ? (
        <fieldset className="practice-canvas__options" disabled={isSubmitted || gradingDisabled}>
          <legend className="sr-only">Choose an option</legend>
          {data.options.map((opt) => {
            const selected = selectedOption === opt.id;
            const isRight = isSubmitted && opt.id === data.correct_answer;
            const isWrong = isSubmitted && selected && !isCorrect;
            return (
              <label
                key={opt.id}
                className={`practice-canvas__option${selected ? " is-selected" : ""}${
                  isRight ? " is-right" : ""
                }${isWrong ? " is-wrong" : ""}`}
              >
                <input
                  type="radio"
                  name={`${formId}-option`}
                  value={opt.id}
                  checked={selected}
                  onChange={() => setSelectedOption(opt.id)}
                />
                <span className="practice-canvas__option-id">{opt.id}</span>
                <MarkdownMath content={opt.latex} className="markdown-math practice-canvas__math" />
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {data.type === "numerical" ? (
        <label className="practice-canvas__numeric">
          <span>Your answer</span>
          <input
            type="text"
            inputMode="decimal"
            value={numericalAnswer}
            onChange={(event) => setNumericalAnswer(event.target.value)}
            disabled={isSubmitted || gradingDisabled}
            placeholder="Enter the value"
            autoComplete="off"
          />
        </label>
      ) : null}

      {!isSubmitted ? (
        <button type="button" className="practice-canvas__submit" onClick={handleSubmit} disabled={!canSubmit}>
          Check answer
        </button>
      ) : (
        <section
          className={`practice-canvas__result${isCorrect ? " is-correct" : " is-incorrect"}`}
          aria-live="polite"
        >
          <p className="practice-canvas__result-label">{isCorrect ? "Correct" : "Not quite"}</p>
          {!isCorrect && data.type === "mcq" && selectedOption && data.distractor_analysis?.[selectedOption] ? (
            <div className="practice-canvas__why">
              <p>Why {selectedOption} is off</p>
              <MarkdownMath
                content={data.distractor_analysis[selectedOption]}
                className="markdown-math practice-canvas__math"
              />
            </div>
          ) : null}
          {data.solution_walkthrough ? (
            <div className="practice-canvas__solution">
              <h3>Worked solution</h3>
              <MarkdownMath
                content={data.solution_walkthrough}
                className="markdown-math practice-canvas__math"
              />
            </div>
          ) : null}
        </section>
      )}

      {remainder ? (
        <div className="practice-canvas__extra">
          <MarkdownMath content={remainder} className="markdown-math practice-canvas__math" />
        </div>
      ) : null}

      <p className="practice-canvas__hint">The problem stays here. Use chat for a hint or a follow-up.</p>
    </article>
  );
}
