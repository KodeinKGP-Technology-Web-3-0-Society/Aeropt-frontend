import React from "react";
import MarkdownMath from "@/components/MarkdownMath";
import InteractivePracticeCanvas from "@/components/InteractivePracticeCanvas";
import PracticeAttemptView from "@/components/PracticeAttemptView";
import PracticeBatchCanvas from "@/components/PracticeBatchCanvas";
import { FlashcardDeck, GradingButtons, CollapsibleScoreSummary, QuizAssessmentNotice } from "@/components/StudySessionCards";
import ProactiveIntroCard from "@/components/slides/ProactiveIntroCard";
import { 
  asPracticeBatch, 
  asPracticeData, 
  extractPracticeQuestion, 
  looksLikePracticeDump, 
  splitPracticeAttempt,
  type InteractivePracticeData
} from "@/lib/practiceContent";
import type { Message } from "./types";
import type { AgentChatResponse, FlashcardItem } from "@/lib/agent";

function TypingIndicator() {
  return (
    <div className="assistant-thinking" role="status" aria-live="polite" aria-label="Assistant is typing">
      <span />
      <span />
      <span />
      <span className="sr-only">Assistant is typing</span>
    </div>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M5 5h14v14H5V5Zm10 0v14" />
    </svg>
  );
}

function AssistantExtras({
  agent,
  onGrade,
  onPickCard,
  gradingDisabled,
  suppressPicker,
  isLatest,
  hideGrade,
}: {
  agent?: AgentChatResponse | null;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
  isLatest?: boolean;
  hideGrade?: boolean;
}) {
  if (!agent) return null;
  const showFlashcards =
    agent.flashcards &&
    !(suppressPicker && agent.flashcards.mode === "picker");
  return (
    <>
      {agent.mistake_brief && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
            Where you went wrong
          </p>
          <MarkdownMath content={agent.mistake_brief} className="markdown-math text-sm" />
        </div>
      )}
      {agent.card && isLatest && !suppressPicker && (
        <ProactiveIntroCard card={agent.card} />
      )}
      {agent.grading_ui && isLatest && !hideGrade && (
        <GradingButtons gradingUi={agent.grading_ui} disabled={gradingDisabled} onGrade={onGrade} />
      )}
      {showFlashcards && (
        <FlashcardDeck
          cards={agent.flashcards!.cards}
          mode={agent.flashcards!.mode}
          onSelect={agent.flashcards!.mode === "picker" ? onPickCard : undefined}
        />
      )}
      {agent.score_summary && <CollapsibleScoreSummary summary={agent.score_summary} />}
      {agent.quiz_assessment?.require_end_assessment && (
        <QuizAssessmentNotice batchSize={agent.quiz_assessment.batch_size} />
      )}
    </>
  );
}

export default function AssistantResponse({
  message,
  onGrade,
  onPickCard,
  onOpenBatchCanvas,
  onFlagStep,
  gradingDisabled,
  suppressPicker,
  isLatest,
  pinPractice,
}: {
  message: Message;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  onOpenBatchCanvas?: (batch: InteractivePracticeData[], messageId: string) => void;
  onFlagStep?: (stepId: string) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
  isLatest?: boolean;
  pinPractice?: boolean;
}) {
  const extracted = extractPracticeQuestion(message.content);
  const practice = asPracticeData(message.agent?.practice_question) ?? extracted.data;
  const extras = (
    <AssistantExtras
      agent={message.agent}
      onGrade={onGrade}
      onPickCard={onPickCard}
      gradingDisabled={gradingDisabled}
      suppressPicker={suppressPicker}
      isLatest={isLatest}
      hideGrade={Boolean(practice)}
    />
  );

  const practiceBatch = asPracticeBatch(message.agent?.practice_batch);
  const isPreparing =
    message.content.includes("[PREPARING]") && practiceBatch.length === 0 && !practice;

  if (isPreparing) {
    const text = message.content.replace("[PREPARING]", "").trim();
    return (
      <article className="lesson-response assistant-plain">
        <div className="flex items-center gap-3 text-accent">
          <TypingIndicator />
          <span className="font-medium animate-pulse">{text || "Preparing questions..."}</span>
        </div>
      </article>
    );
  }

  if (practice && pinPractice) {
    return (
      <article className="lesson-response assistant-plain">
        <p className="practice-canvas-stub">
          Practice question is open on the canvas. Attempt it there, then ask here if you want a hint.
        </p>
        {extras}
      </article>
    );
  }

  if (practiceBatch.length > 0) {
    const n = practiceBatch.length;
    return (
      <article className="lesson-response assistant-plain">
        <MarkdownMath content={message.content} />
        <div className="practice-open-canvas-wrap">
          <button
            type="button"
            onClick={() => onOpenBatchCanvas?.(practiceBatch, message.id)}
            className="practice-open-canvas-btn"
          >
            <span>
              {n === 1 ? "Open practice canvas" : `Open practice canvas (${n} questions)`}
            </span>
            <PanelIcon />
          </button>
        </div>
        {extras}
      </article>
    );
  }

  if (practice) {
    return (
      <article className="lesson-response assistant-plain">
        <InteractivePracticeCanvas
          data={practice}
          remainder={extracted.remainder}
          onGrade={isLatest ? onGrade : undefined}
          gradingDisabled={gradingDisabled}
        />
        {extras}
      </article>
    );
  }

  if (looksLikePracticeDump(message.content)) {
    return (
      <article className="lesson-response assistant-plain">
        <p className="practice-canvas-stub">Opening the practice canvas…</p>
      </article>
    );
  }

  const practiceSplit = splitPracticeAttempt(message.content);
  const hidePracticeSolution = Boolean(
    isLatest && message.agent?.grading_ui?.show_correct_incorrect,
  );

  const hasSteps = message.agent?.steps && message.agent.steps.length > 0;

  return (
    <article className="lesson-response assistant-plain">
      {practiceSplit ? (
        <PracticeAttemptView
          question={practiceSplit.question}
          remainder={practiceSplit.remainder}
          hideSolution={hidePracticeSolution}
        />
      ) : hasSteps ? (
        <div className="flex flex-col gap-4 w-full">
          {message.agent!.steps!.map((step) => (
            <div key={step.step_id} className="relative group p-4 bg-white/5 border border-white/10 rounded-xl transition-colors hover:bg-white/10">
              <MarkdownMath content={step.text} />
              <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onFlagStep?.(step.step_id)}
                  className="text-xs font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M5 3v18H3V3h2zm2.5 1h12.1c1.3 0 2.2 1.3 1.7 2.5l-1.9 4 1.9 4c.5 1.2-.4 2.5-1.7 2.5H7.5V4z"/>
                  </svg>
                  I don't get this step
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MarkdownMath content={message.content} />
      )}
      {extras}
    </article>
  );
}

