"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { SandboxAction } from "@/lib/sandbox";
import { stagePrompt, type StudyStage } from "@/lib/roadmap";

/**
 * Map a sandbox action type to the study stage + chat prompt it should open,
 * mirroring the agent's `action_to_query` so PRACTICE/PYQ/QUIZ cards don't all
 * deep-link into a plain "Explain …" theory turn.
 */
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

export default function SandboxCardDeck({
  queue,
  loading,
}: {
  queue: SandboxAction[];
  loading?: boolean;
}) {
  const router = useRouter();

  function startAction(item: SandboxAction) {
    // Navigate only — do not pre-call /sandbox/execute. ChatWorkspace owns the
    // first teaching turn via auto-prompt (avoids duplicate orphan sessions).
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!queue.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold dark:text-white text-slate-900 uppercase tracking-wider">Today&apos;s focus</h2>
        <span className="text-[10px] dark:text-slate-500 text-slate-500">{queue.length} recommendations</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list" aria-label="Recommended next actions">
        {queue.slice(0, 3).map((item) => (
          <FocusCard key={item.id} item={item} onStart={() => startAction(item)} onWhy={() => router.push("/roadmap")} />
        ))}
      </div>
    </div>
  );
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#05060c] focus-visible:ring-offset-white";

function FocusCard({
  item,
  onStart,
  onWhy,
}: {
  item: SandboxAction;
  onStart: () => void;
  onWhy: () => void;
}) {
  const [showWhy, setShowWhy] = React.useState(false);
  return (
    <div
      role="listitem"
      className="dark:bg-[#0d0e16] bg-white border dark:border-[#6258ff]/30 border-indigo-200 rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[150px]"
    >
      <div>
        <p className="text-[10px] font-bold text-[#8584ff] uppercase tracking-wider">{item.action}</p>
        <h3 className="text-sm font-bold dark:text-white text-slate-900 mt-1">{item.concept_name}</h3>
        <p className="text-xs dark:text-slate-500 text-slate-500 mt-1">{item.reason}</p>
        <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-2">
          {item.duration_min ?? 8} min{item.chapter ? ` · ${item.chapter}` : ""}
        </p>
        {showWhy && item.reason && (
          <p className="mt-3 text-[11px] dark:text-slate-400 text-slate-600 border-l-2 border-[#6258ff]/40 pl-2">
            {item.reason}
          </p>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onStart}
          aria-label={`Start ${item.action.toLowerCase()} on ${item.concept_name}`}
          className={`flex-1 bg-[#6258ff] hover:bg-[#5045ff] text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg cursor-pointer ${FOCUS_RING}`}
        >
          Start
        </button>
        <button
          type="button"
          aria-expanded={showWhy}
          aria-label={`Why is ${item.concept_name} recommended?`}
          onClick={() => (item.reason ? setShowWhy((v) => !v) : onWhy())}
          className={`px-3 border dark:border-[#1b1c2b] border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500 cursor-pointer ${FOCUS_RING}`}
        >
          Why?
        </button>
      </div>
    </div>
  );
}
