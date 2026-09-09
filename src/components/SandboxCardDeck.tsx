"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { SandboxAction } from "@/lib/sandbox";
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

  function startAction(item: SandboxAction) {
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

  function startQuick(slot: QuickSlot) {
    const params = new URLSearchParams({ prompt: slot.prompt, stage: slot.stage, fresh: "1" });
    router.push(`/chat?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[148px] animate-pulse rounded-xl border border-line bg-surface" />
        ))}
      </div>
    );
  }

  const queued = queue.slice(0, 3);
  const fillers = QUICK_SLOTS.filter((slot) =>
    !queued.some((item) => item.concept_name.toLowerCase() === slot.title.toLowerCase())
  ).slice(0, Math.max(0, 3 - queued.length));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="list" aria-label="Recommended next actions">
      {queued.map((item) => (
        <FocusCard
          key={item.id}
          action={item.action}
          title={item.concept_name}
          hint={item.reason || item.chapter || "Recommended for today"}
          minutes={item.duration_min ?? 8}
          onStart={() => startAction(item)}
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
}: {
  action: string;
  title: string;
  hint: string;
  minutes: number;
  onStart: () => void;
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
      <button
        type="button"
        onClick={onStart}
        aria-label={`Start ${action.toLowerCase()} on ${title}`}
        className={`mt-3 min-h-10 w-full rounded-lg bg-accent text-xs font-bold uppercase tracking-wider text-accent-on hover:bg-accent-hover ${FOCUS_RING}`}
      >
        Start
      </button>
    </div>
  );
}
