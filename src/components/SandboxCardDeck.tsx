"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeSandboxAction,
  dismissSandboxAction,
  type SandboxAction,
} from "@/lib/sandbox";
import { ApiError } from "@/lib/auth";
import { stagePrompt, type StudyStage } from "@/lib/roadmap";

function actionToChat(action: string, conceptName: string): { stage: StudyStage; prompt: string } {
  switch ((action || "LEARN").toUpperCase()) {
    case "PRACTICE":
      return { stage: "practice", prompt: stagePrompt(conceptName, "practice") };
    case "PYQ":
    case "MOCK_SLICE":
      return { stage: "pyq", prompt: stagePrompt(conceptName, "pyq") };
    case "QUIZ":
      return { stage: "practice", prompt: `Quiz me on ${conceptName}` };
    case "REVISE":
      return { stage: "theory", prompt: `Quick revision on ${conceptName}` };
    case "PREREQ":
      return { stage: "theory", prompt: `Explain the prerequisite concept ${conceptName}` };
    default:
      return { stage: "theory", prompt: stagePrompt(conceptName, "theory") };
  }
}

type QuickSlot = {
  id: string;
  action: string;
  title: string;
  hint: string;
  minutes: number;
  prompt: string;
  stage: StudyStage;
};

const QUICK_SLOTS: QuickSlot[] = [
  {
    id: "quick-drill",
    action: "Practice",
    title: "10-min PCM drill",
    hint: "Mixed speed set across three subjects",
    minutes: 10,
    prompt: "Give me a 10-minute mixed JEE drill across Physics, Chemistry and Maths.",
    stage: "practice",
  },
  {
    id: "quick-pyq",
    action: "PYQ",
    title: "One past-year question",
    hint: "Attempt first, then walk the solution",
    minutes: 12,
    prompt: "Give me one JEE PYQ and walk me through the solution after I attempt it.",
    stage: "pyq",
  },
  {
    id: "quick-quiz",
    action: "Quiz",
    title: "Weak-spot quiz",
    hint: "Keep questions coming until you stop",
    minutes: 8,
    prompt: "Quiz me on a weak concept and keep questions coming until I ask to stop.",
    stage: "practice",
  },
];

export default function SandboxCardDeck({
  queue,
  loading,
}: {
  queue: SandboxAction[];
  loading?: boolean;
}) {
  const router = useRouter();
  // Local copy so a decision can be reflected immediately (optimistic dismiss)
  // and corrected from the queue the mutation response carries — the parent
  // owns the fetch, not the decision.
  const [cards, setCards] = useState<SandboxAction[]>(queue);
  const [syncedQueue, setSyncedQueue] = useState<SandboxAction[]>(queue);
  const [notice, setNotice] = useState("");

  // Adjust state during render when the fetched queue changes (React's
  // documented alternative to a setState-in-effect sync).
  if (queue !== syncedQueue) {
    setSyncedQueue(queue);
    setCards(queue);
  }

  function startAction(item: SandboxAction) {
    // No completion signal exists in the chat layer for "this card's flow is
    // done" (see the comment on dismissAction), so clicking through is what we
    // can honestly observe: the student took the card on.
    void completeSandboxAction(item.id, {
      action: item.action,
      concept_id: item.concept_id,
      roadmap_node_id: item.roadmap_node_id,
    }).catch(() => {
      // Navigation is already underway; a lost signal only means the card
      // reappears in tomorrow's queue, which is the safe direction to fail.
    });

    const { stage, prompt } = actionToChat(item.action, item.concept_name);
    const params = new URLSearchParams({
      concept_id: item.concept_id,
      prompt,
      stage,
      fresh: "1",
    });
    if (item.roadmap_node_id) params.set("node_id", item.roadmap_node_id);
    router.push(`/chat?${params.toString()}`);
  }

  /**
   * Optimistic: drop the card, then reconcile with the rebuilt queue the
   * response carries (no refetch). On failure put the card back and say why,
   * using `ApiError.retryable` rather than message text.
   */
  async function dismissAction(item: SandboxAction) {
    const previous = cards;
    setCards((current) => current.filter((card) => card.id !== item.id));
    setNotice("");
    try {
      const result = await dismissSandboxAction(item.id, {
        action: item.action,
        concept_id: item.concept_id,
        roadmap_node_id: item.roadmap_node_id,
      });
      if (result?.queue?.queue) setCards(result.queue.queue);
    } catch (caught) {
      setCards(previous);
      const retryable = caught instanceof ApiError ? caught.retryable : true;
      setNotice(
        retryable
          ? "Could not skip that card just now. Try again."
          : caught instanceof Error
            ? caught.message
            : "Could not skip that card."
      );
    }
  }

  function startQuick(slot: QuickSlot) {
    const params = new URLSearchParams({ prompt: slot.prompt, stage: slot.stage, fresh: "1" });
    router.push(`/chat?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="status" aria-busy="true" aria-label="Loading recommended actions">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[148px] animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  const queued = cards.slice(0, 3);
  const fillers = QUICK_SLOTS.filter((slot) =>
    !queued.some((item) => item.concept_name.toLowerCase() === slot.title.toLowerCase())
  ).slice(0, Math.max(0, 3 - queued.length));

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list" aria-label="Recommended next actions">
        {queued.map((item) => (
          <FocusCard
            key={item.id}
            action={item.action}
            title={item.concept_name}
            hint={item.reason || item.chapter || "Recommended for today"}
            minutes={item.duration_min ?? 8}
            onStart={() => startAction(item)}
            onDismiss={() => void dismissAction(item)}
          />
        ))}
        {fillers.map((slot) => (
          <FocusCard
            key={slot.id}
            action={slot.action}
            title={slot.title}
            hint={slot.hint}
            minutes={slot.minutes}
            onStart={() => startQuick(slot)}
          />
        ))}
      </div>
      {notice ? (
        <p role="status" className="mt-2 text-[11px] text-danger">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

function FocusCard({
  action,
  title,
  hint,
  minutes,
  onStart,
  onDismiss,
}: {
  action: string;
  title: string;
  hint: string;
  minutes: number;
  onStart: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="listitem"
      className="flex min-h-[148px] flex-col justify-between rounded-xl border border-line bg-surface p-4"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent">{action}</p>
        <h3 className="mt-1 text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{hint}</p>
        <p className="mt-2 text-[11px] text-muted">{minutes} min</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onStart}
          aria-label={`Start ${action.toLowerCase()} on ${title}`}
          className={`min-h-10 flex-1 rounded-lg bg-accent text-xs font-bold uppercase tracking-wider text-accent-on hover:bg-accent-hover ${FOCUS_RING}`}
        >
          Start
        </button>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Not now: skip ${title} today`}
            className={`min-h-10 shrink-0 rounded-lg border border-line px-3 text-[11px] font-semibold text-muted hover:bg-hover hover:text-ink ${FOCUS_RING}`}
          >
            Not now
          </button>
        ) : null}
      </div>
    </div>
  );
}
