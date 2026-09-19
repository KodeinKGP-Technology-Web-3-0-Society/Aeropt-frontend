"use client";

import { useState } from "react";
import InteractivePracticeCanvas from "./InteractivePracticeCanvas";
import type { InteractivePracticeData } from "@/lib/practiceContent";

type PracticeBatchCanvasProps = {
  batch: InteractivePracticeData[];
  onClose: () => void;
  onSubmitBatch: (results: Array<{ question_id: string; is_correct: boolean; time_taken: number }>) => void;
  isSubmitting?: boolean;
};

export default function PracticeBatchCanvas({
  batch,
  onClose,
  onSubmitBatch,
  isSubmitting,
}: PracticeBatchCanvasProps) {
  const [results, setResults] = useState<Record<number, { question_id: string; is_correct: boolean; time_taken: number }>>({});

  const handleGrade = (index: number, outcome: "correct" | "incorrect") => {
    setResults((prev) => ({
      ...prev,
      [index]: {
        question_id: `q-${index}`,
        is_correct: outcome === "correct",
        time_taken: 60,
      },
    }));
  };

  const handleSubmitAll = () => {
    const resultsArray = batch.map((_, i) => results[i] || {
      question_id: `q-${i}`,
      is_correct: false,
      time_taken: 0,
    });
    onSubmitBatch(resultsArray);
  };

  const allAnswered = Object.keys(results).length === batch.length;

  return (
    <div className="practice-batch-overlay">
      <header className="practice-batch-overlay__header">
        <div>
          <h2 className="practice-batch-overlay__title">Practice canvas</h2>
          <p className="practice-batch-overlay__meta">{batch.length} questions</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="practice-batch-overlay__close"
          title="Close canvas"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="practice-batch-overlay__body">
        {batch.map((question, idx) => (
          <div key={`${question.question_text.slice(0, 24)}-${idx}`} className="practice-batch-overlay__item">
            <div className="practice-batch-overlay__index">Question {idx + 1}</div>
            <InteractivePracticeCanvas
              data={question}
              onGrade={(outcome) => handleGrade(idx, outcome)}
              gradingDisabled={isSubmitting}
            />
          </div>
        ))}
      </div>

      <footer className="practice-batch-overlay__footer">
        <p className="practice-batch-overlay__meta">
          {Object.keys(results).length} of {batch.length} answered
        </p>
        <button
          type="button"
          onClick={handleSubmitAll}
          disabled={!allAnswered || isSubmitting}
          className="practice-batch-overlay__submit"
        >
          {isSubmitting ? "Submitting..." : "Submit all answers"}
        </button>
      </footer>
    </div>
  );
}
