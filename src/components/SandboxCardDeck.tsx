"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { SandboxAction } from "@/lib/sandbox";
import { executeSandboxAction } from "@/lib/agent";
import { getSupabaseUserId } from "@/lib/auth";

export default function SandboxCardDeck({
  queue,
  loading,
}: {
  queue: SandboxAction[];
  loading?: boolean;
}) {
  const router = useRouter();

  async function startAction(item: SandboxAction) {
    const userId = getSupabaseUserId();
    if (!userId) return;
    try {
      await executeSandboxAction({
        userId,
        sessionId: null,
        action: item.action,
        conceptId: item.concept_id,
        conceptName: item.concept_name,
        roadmapNodeId: item.roadmap_node_id,
        reason: item.reason,
        durationMin: item.duration_min,
        proficiencyPct: item.proficiency_pct,
      });
    } catch {
      // Fall through to chat deep-link even if execute fails
    }
    const params = new URLSearchParams({
      concept_id: item.concept_id,
      prompt: `Explain ${item.concept_name}`,
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queue.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="dark:bg-[#0d0e16] bg-white border dark:border-[#6258ff]/30 border-indigo-200 rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[150px]"
          >
            <div>
              <p className="text-[10px] font-bold text-[#8584ff] uppercase tracking-wider">{item.action}</p>
              <h3 className="text-sm font-bold dark:text-white text-slate-900 mt-1">{item.concept_name}</h3>
              <p className="text-xs dark:text-slate-500 text-slate-500 mt-1">{item.reason}</p>
              <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-2">
                {item.duration_min ?? 8} min · {item.chapter}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => void startAction(item)}
                className="flex-1 bg-[#6258ff] hover:bg-[#5045ff] text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-lg cursor-pointer"
              >
                Start
              </button>
              <button
                type="button"
                onClick={() => router.push("/roadmap")}
                className="px-3 border dark:border-[#1b1c2b] border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500 cursor-pointer"
              >
                Why?
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
