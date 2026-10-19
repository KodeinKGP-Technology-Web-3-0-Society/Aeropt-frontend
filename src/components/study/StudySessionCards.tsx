"use client";

import React, { useState } from "react";
import Link from "next/link";
import MarkdownMath from "@/components/MarkdownMath";
import MathExpandModal from "@/components/slides/MathExpandModal";
import type { FlashcardItem, GradingUIPayload } from "@/lib/api/agent";
import type { StudyStage } from "@/lib/api/roadmap";

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
  slideProgress,
  slidesComplete,
  requiresSlides,
  onAdvance,
  layout = "toolbar",
}: {
  stages: string[];
  currentStageIndex: number;
  conceptName: string;
  loading?: boolean;
  conceptComplete?: boolean;
  slideProgress?: { current: number; total: number } | null;
  slidesComplete?: boolean;
  /** When true, Next stays disabled until slidesComplete (theory/example with a deck). */
  requiresSlides?: boolean;
  onAdvance: (stage: StudyStage) => void;
  layout?: "toolbar" | "card";
}) {
  if (!stages.length) return null;

  const nextBlocked =
    Boolean(requiresSlides) && !slidesComplete;

  const stageChips = stages.map((stage, index) => {
    const done = index < currentStageIndex || conceptComplete;
    const active = index === currentStageIndex && !conceptComplete;
    return (
      <span
        key={stage}
        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
          done
            ? "border-line text-success"
            : active
              ? "border-accent/50 bg-accent-soft text-accent"
              : "border-line text-muted"
        }`}
      >
        {STAGE_LABELS[stage] ?? stage}
      </span>
    );
  });

  const slideHint =
    requiresSlides && !slidesComplete
      ? slideProgress && slideProgress.total > 0
        ? `Slide ${slideProgress.current + 1} of ${slideProgress.total} — finish slides to continue`
        : "Finish the slide deck to continue"
      : null;

  if (layout === "toolbar") {
    return (
      <div className="study-step-toolbar">
        <div className="study-step-toolbar__meta">
          <p className="study-step-toolbar__label">Study path · {conceptName}</p>
          <div className="study-step-toolbar__chips">{stageChips}</div>
        </div>
        <div className="study-step-toolbar__actions">
          {slideHint && <p className="study-step-toolbar__hint">{slideHint}</p>}
          {conceptComplete ? (
            <div className="study-step-toolbar__complete">
              <p>Concept complete!</p>
              <Link
                href="/roadmap"
                className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5"
              >
                Back to roadmap
              </Link>
            </div>
          ) : currentStageIndex < stages.length - 1 ? (
            <button
              type="button"
              disabled={loading || nextBlocked}
              onClick={() => onAdvance(stages[currentStageIndex + 1] as StudyStage)}
              className="study-step-toolbar__next"
            >
              Next: {STAGE_LABELS[stages[currentStageIndex + 1]] ?? stages[currentStageIndex + 1]} →
            </button>
          ) : (
            <p className="study-step-toolbar__hint">
              Complete the final question above, then grade your answer to finish this concept.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-3">
        Study path · {conceptName}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">{stageChips}</div>
      {requiresSlides && slideProgress && slideProgress.total > 0 && !slidesComplete && (
        <p className="text-xs text-muted mb-3">
          Slide {slideProgress.current + 1} of {slideProgress.total} — finish slides to continue
        </p>
      )}
      {requiresSlides && !slidesComplete && !(slideProgress && slideProgress.total > 0) && (
        <p className="text-xs text-muted mb-3">
          Finish the slide deck to continue
        </p>
      )}
      {conceptComplete ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <p className="text-sm font-semibold text-success flex-1">Concept complete!</p>
          <Link
            href="/roadmap"
            className="inline-flex items-center justify-center rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5"
          >
            Back to roadmap
          </Link>
        </div>
      ) : (
        currentStageIndex < stages.length - 1 && (
          <button
            type="button"
            disabled={loading || nextBlocked}
            onClick={() => onAdvance(stages[currentStageIndex + 1] as StudyStage)}
            className="w-full rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
          >
            Next: {STAGE_LABELS[stages[currentStageIndex + 1]] ?? stages[currentStageIndex + 1]} →
          </button>
        )
      )}
      {!conceptComplete && currentStageIndex >= stages.length - 1 && (
        <p className="text-xs text-muted">
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
    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold text-ink-2">{gradingUi.prompt}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onGrade("correct")}
          className="flex-1 rounded-lg bg-success hover:opacity-90 disabled:opacity-50 text-accent-on text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
        >
          Correct
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onGrade("incorrect")}
          className="flex-1 rounded-lg bg-danger hover:opacity-90 disabled:opacity-50 text-accent-on text-xs font-bold uppercase tracking-wider py-2.5 cursor-pointer"
        >
          Incorrect
        </button>
      </div>
    </div>
  );
}

const CARD_TYPE_LABELS: Record<string, string> = {
  quiz: "Question",
  example: "Example",
  theory: "Concept",
  formula: "Key formula",
  micro_step: "Next step",
  prereq: "Foundation",
};

function cardTypeBadge(cardType: string, flipped: boolean): string {
  if (flipped) return "Answer";
  return (
    CARD_TYPE_LABELS[cardType] ??
    cardType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function plainPreviewText(markdown: string, maxLen = 120): string {
  const stripped = markdown
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]+\$/g, " ")
    .replace(/[#*_`>\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (stripped.length <= maxLen) return stripped;
  return `${stripped.slice(0, maxLen - 1).trim()}…`;
}

function truncateMarkdownPreview(markdown: string, maxLen = 140): string {
  const text = markdown.trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

/** Follow-up picker: one tap selects — KaTeX-aware preview. */
function PickerCard({
  card,
  onSelect,
}: {
  card: FlashcardItem;
  onSelect: (card: FlashcardItem) => void;
}) {
  const preview = truncateMarkdownPreview(card.front, 140);
  const difficulty = card.hint?.replace(/Hint:\s*/i, "").trim();

  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      aria-label={`Select ${plainPreviewText(card.front, 80)}`}
      className="group flex h-full min-h-[168px] max-h-[220px] w-full flex-col rounded-xl border border-line bg-surface p-4 text-left shadow-lg transition-all hover:border-accent/50 hover:shadow-[0_0_20px_rgba(98,88,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
        {cardTypeBadge(card.card_type, false)}
      </span>
      <div className="mt-2 flex-1 overflow-hidden text-xs leading-relaxed text-ink-2 max-h-[120px]">
        <MarkdownMath content={preview} className="markdown-math markdown-math--card" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        {difficulty ? (
          <span className="text-[10px] text-warning" aria-label={`Difficulty ${difficulty.length} of 5`}>
            {difficulty}
          </span>
        ) : (
          <span className="text-[10px] text-muted">Tap to open</span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent group-hover:text-white">
          Select →
        </span>
      </div>
    </button>
  );
}

function FlipCard({
  card,
  flipped,
  onToggle,
  onExpand,
}: {
  card: FlashcardItem;
  flipped: boolean;
  onToggle: () => void;
  onExpand?: (content: string, title: string) => void;
}) {
  const faceContent = flipped ? card.back : card.front;
  const faceTitle = cardTypeBadge(card.card_type, flipped);

  return (
    <div className="group w-full text-left rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        className="w-full [perspective:1000px] cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-pressed={flipped}
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <div
          className={`relative min-h-[200px] transition-transform duration-500 motion-reduce:transition-none [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-lg [backface-visibility:hidden]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
              {cardTypeBadge(card.card_type, false)}
            </span>
            <div className="mt-2 max-h-[220px] overflow-y-auto text-sm text-ink-2">
              <MarkdownMath content={card.front} className="markdown-math markdown-math--card" />
            </div>
            {card.hint && !card.selectable && (
              <p className="text-[10px] text-muted mt-2 truncate">Hint: {card.hint}</p>
            )}
            <p className="mt-2 text-[9px] text-muted">Tap to flip</p>
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-accent/30 bg-accent-soft p-4 shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
              {cardTypeBadge(card.card_type, true)}
            </span>
            <div className="mt-2 max-h-[220px] overflow-y-auto text-sm text-ink-2">
              <MarkdownMath content={card.back} className="markdown-math markdown-math--card" />
            </div>
            <p className="mt-2 text-[9px] text-muted">Tap to flip back</p>
          </div>
        </div>
      </button>
      {onExpand && (
        <button
          type="button"
          onClick={() => onExpand(faceContent, faceTitle)}
          className="mt-2 text-[10px] font-bold uppercase tracking-wider text-accent hover:text-white"
        >
          Expand
        </button>
      )}
    </div>
  );
}

function QuizCarousel({
  cards,
  flipped,
  setFlipped,
  onExpand,
}: {
  cards: FlashcardItem[];
  flipped: Record<string, boolean>;
  setFlipped: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onExpand?: (content: string, title: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const card = cards[index];
  if (!card) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted">
        <button
          type="button"
          disabled={index === 0}
          aria-label="Previous card"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          className="disabled:opacity-30 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
        >
          ← Prev
        </button>
        <span aria-live="polite">
          Card {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          disabled={index >= cards.length - 1}
          aria-label="Next card"
          onClick={() => setIndex((value) => Math.min(cards.length - 1, value + 1))}
          className="disabled:opacity-30 hover:text-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
        >
          Next →
        </button>
      </div>
      <FlipCard
        card={card}
        flipped={!!flipped[card.id]}
        onToggle={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
        onExpand={onExpand}
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
  const [expandModal, setExpandModal] = useState<{ content: string; title: string } | null>(null);

  if (!cards.length) return null;

  const handleExpand = (content: string, title: string) => {
    setExpandModal({ content, title });
  };

  return (
    <div className="mt-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
        {mode === "remediation" ? "Remediation cards" : mode === "picker" ? "Pick your next step" : "Quiz deck"}
      </p>
      {mode === "quiz" ? (
        <QuizCarousel cards={cards} flipped={flipped} setFlipped={setFlipped} onExpand={handleExpand} />
      ) : mode === "picker" && onSelect ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <PickerCard key={card.id} card={card} onSelect={onSelect} />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="space-y-2">
              <FlipCard
                card={card}
                flipped={!!flipped[card.id]}
                onToggle={() => setFlipped((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                onExpand={handleExpand}
              />
              {card.selectable && onSelect && (
                <button
                  type="button"
                  onClick={() => onSelect(card)}
                  aria-label={`Select ${card.front}`}
                  className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1"
                >
                  Select →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {expandModal && (
        <MathExpandModal
          title={expandModal.title}
          content={expandModal.content}
          onClose={() => setExpandModal(null)}
        />
      )}
    </div>
  );
}

export function CollapsibleScoreSummary({ summary }: { summary: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-line overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full cursor-pointer bg-hover px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {open ? "Hide" : "Show"} score summary
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-ink-2 border-t border-line">
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
    <div className="mt-3 rounded-lg border border-accent/30 bg-accent-soft px-4 py-3 text-xs text-ink-2">
      Review all {batchSize} cards, then use Correct / Incorrect for each question as you work through the quiz.
    </div>
  );
}
