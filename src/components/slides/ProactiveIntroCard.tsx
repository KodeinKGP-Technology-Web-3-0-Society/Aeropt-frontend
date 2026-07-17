"use client";

import React from "react";
import type { ProactiveCardPayload } from "@/lib/agent";

export default function ProactiveIntroCard({ card }: { card: ProactiveCardPayload }) {
  return (
    <div className="mb-4 rounded-xl border dark:border-[#6258ff]/40 border-indigo-200 dark:bg-[#121126]/60 bg-indigo-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8584ff]">
            {card.card_type.replace(/_/g, " ")}
          </p>
          <h3 className="text-base font-bold dark:text-white text-slate-900 mt-1">{card.title}</h3>
          {card.preview_text && (
            <p className="text-xs dark:text-slate-400 text-slate-600 mt-2 line-clamp-3">{card.preview_text}</p>
          )}
        </div>
        {typeof card.proficiency_pct === "number" && (
          <div className="shrink-0 text-center">
            <span className="text-lg font-bold text-[#8584ff]">{card.proficiency_pct}%</span>
            <p className="text-[9px] uppercase tracking-wider text-slate-500">proficiency</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] dark:text-slate-500 text-slate-500">
        {card.duration_min && <span>{card.duration_min} min</span>}
        {card.weak_prereq && <span>· Weak prereq: {card.weak_prereq}</span>}
      </div>
    </div>
  );
}
