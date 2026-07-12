"use client";

import React, { useState } from "react";
import Link from "next/link";
import MarkdownMath from "@/components/MarkdownMath";
import type { FlashcardItem, GradingUIPayload } from "@/lib/agent";
import type { StudyStage } from "@/lib/roadmap";

const STAGE_LABELS: Record<string, string> = {
  theory: "Theory",
  example: "Worked example",
  practice: "Practice",
  pyq: "PYQ",
};

export function StudyStepBar({
  stages,
  currentStageIndex,
  conceptName,
  loading,
  conceptComplete,
  onAdvance,
}: {
  stages: string[];
  currentStageIndex: number;
  conceptName: string;
  loading?: boolean;
  conceptComplete?: boolean;
  onAdvance: (stage: StudyStage) => void;
}) {
  if (!stages.length) return null;

  return (
    <div className="mt-4 rounded-xl border dark:border-[#6258ff]/30 border-indigo-200 dark:bg-[#121126]/50 bg-indigo-50/40 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8584ff] mb-3">
        Study path · {conceptName}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {stages.map((stage, index) => {
          const done = index < currentStageIndex || conceptComplete;
          const active = index === currentStageIndex && !conceptComplete;
          return (
            <span
              key={stage}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                done
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-400"
                  : active
                    ? "border-[#6258ff]/50 bg-[#6258ff]/15 text-[#8584ff]"
                    : "border-slate-500/20 text-slate-500"
              }`}
            >
              {STAGE_LABELS[stage] ?? stage}
            </span>
          );
        })}
      </div>
      {conceptComplete ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <p className="text-sm font-semibold text-emerald-400 flex-1">Concept complete!</p>
          <Link
            href="/roadmap"
            className="inline-flex items-center justify-center rounded-lg bg-[#6258ff] hover:bg-[#5045ff] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5"
          >
            Back to roadmap
          </Link>
        </div>
      ) : (
        currentStageIndex < stages.length - 1 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => onAdvance(stages[currentStageIndex + 1] as StudyStage)}
            className="w-full rounded-lg bg-[#6258ff] hover:bg-[#5045ff] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
          >
            Next: {STAGE_LABELS[stages[currentStageIndex + 1]] ?? stages[currentStageIndex + 1]} →
          </button>
        )
      )}
      {!conceptComplete && currentStageIndex >= stages.length - 1 && (
        <p className="text-xs dark:text-slate-400 text-slate-500">
          Complete the final question above, then grade your answer to finish this concept.
        </p>
      )}
    </div>
  );
}

export function GradingButtons({
  gradingUi,
  disabled,
  onGrade,
}: {
  gradingUi: GradingUIPayload;
  disabled?: boolean;
  onGrade: (outcome: "correct" | "incorrect") => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border dark:border-[#6258ff]/30 border-indigo-200 dark:bg-[#121126]/40 bg-indigo-50/40 p-4">
      <p className="text-xs font-semibold dark:text-slate-300 text-slate-700">{gradingUi.prompt}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onGrade("correct")}
          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
        >
          Correct
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onGrade("incorrect")}
          className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
        >
          Incorrect
        </button>
      </div>
    </div>
  );
}

function cardTypeBadge(cardType: string, flipped: boolean): string {
  if (flipped) return "Answer";
  if (cardType === "quiz") return "Question";
  if (cardType === "example") return "Example";
  if (cardType === "theory") return "Concept";
  return cardType.replace("_", " ");
}

function FlipCard({
  card,
  flipped,
  onToggle,
}: {
  card: FlashcardItem;
  flipped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full text-left [perspective:1000px] cursor-pointer"
      aria-label={flipped ? "Show question" : "Show answer"}
    >
      <div
        className={`relative min-h-[160px] transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="absolute inset-0 rounded-xl border dark:border-[#1b1c2b] border-slate-200 dark:bg-[#0d0e16] bg-white p-4 shadow-lg [backface-visibility:hidden]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8584ff]">
            {cardTypeBadge(card.card_type, false)}
          </span>
          <div className="mt-2 text-sm dark:text-slate-200 text-slate-800">
            <MarkdownMath content={card.front} className="markdown-math markdown-math--card" />
          </div>
          {card.hint && (
            <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-3">Hint: {card.hint}</p>
          )}
          <p className="text-[9px] dark:text-slate-600 text-slate-400 mt-4">Tap to flip</p>
        </div>
        <div className="absolute inset-0 rounded-xl border dark:border-[#6258ff]/30 border-indigo-200 dark:bg-[#121126] bg-indigo-50 p-4 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8584ff]">
            {cardTypeBadge(card.card_type, true)}
          </span>
          <div className="mt-2 text-sm dark:text-slate-200 text-slate-800">
            <MarkdownMath content={card.back} className="markdown-math markdown-math--card" />
          </div>
          <p className="text-[9px] dark:text-slate-600 text-slate-400 mt-4">Tap to flip back</p>
        </div>
      </div>
    </button>
  );
}

function QuizCarousel({
  cards,
  flipped,
  setFlipped,
}: {
  cards: FlashcardItem[];
  flipped: Record<string, boolean>;
  setFlipped: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const [index, setIndex] = useState(0);
  const card = cards[index];
  if (!card) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          className="disabled:opacity-30 hover:text-[#8584ff] cursor-pointer"
        >
          ← Prev
        </button>
        <span>
          Card {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          disabled={index >= cards.length - 1}
          onClick={() => setIndex((value) => Math.min(cards.length - 1, value + 1))}
          className="disabled:opacity-30 hover:text-[#8584ff] cursor-pointer"
        >
          Next →
        </button>
      </div>
      <FlipCard
        card={card}
        flipped={!!flipped[card.id]}
        onToggle={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
      />
    </div>
  );
}

export function FlashcardDeck({
  cards,
  mode,
  onSelect,
}: {
  cards: FlashcardItem[];
  mode: string;
  onSelect?: (card: FlashcardItem) => void;
}) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  if (!cards.length) return null;

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8584ff]">
        {mode === "remediation" ? "Remediation cards" : mode === "picker" ? "Pick your next step" : "Quiz deck"}
      </p>
      {mode === "quiz" ? (
        <QuizCarousel cards={cards} flipped={flipped} setFlipped={setFlipped} />
      ) : (
        <div className={`grid gap-3 ${mode === "picker" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {cards.map((card) => (
            <div key={card.id} className="space-y-2">
              <FlipCard
                card={card}
                flipped={!!flipped[card.id]}
                onToggle={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
              />
              {card.selectable && onSelect && (
                <button
                  type="button"
                  onClick={() => onSelect(card)}
                  className="text-[10px] font-bold uppercase tracking-wider text-[#8584ff] hover:text-white cursor-pointer"
                >
                  Select →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CollapsibleScoreSummary({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl border dark:border-[#1b1c2b] border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider dark:bg-[#07080d] bg-slate-50 dark:text-slate-300 text-slate-600 cursor-pointer"
      >
        {open ? "Hide" : "Show"} score summary
      </button>
      {open && (
        <div className="px-4 py-3 text-sm dark:text-slate-300 text-slate-700 border-t dark:border-[#1b1c2b] border-slate-200">
          <MarkdownMath content={summary} />
        </div>
      )}
    </div>
  );
}

export function QuizAssessmentNotice({
  batchSize,
}: {
  batchSize: number;
}) {
  return (
    <div className="mt-3 rounded-lg border dark:border-[#6258ff]/30 border-indigo-200 dark:bg-[#121126]/30 bg-indigo-50/30 px-4 py-3 text-xs dark:text-slate-300 text-slate-600">
      Review all {batchSize} cards, then use Correct / Incorrect for each question as you work through the quiz.
    </div>
  );
}
