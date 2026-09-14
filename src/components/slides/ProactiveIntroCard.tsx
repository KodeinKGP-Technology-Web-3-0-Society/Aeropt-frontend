"use client";

import React from "react";
import type { ProactiveCardPayload } from "@/lib/agent";

export default function ProactiveIntroCard({ card }: { card: ProactiveCardPayload }) {
  return (
    <div className="mb-4 rounded-xl border border-accent/40 bg-accent-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            {card.card_type.replace(/_/g, " ")}
          </p>
          <h3 className="text-base font-bold text-ink mt-1">{card.title}</h3>
          {card.preview_text && (
            <p className="text-xs text-ink-2 mt-2 line-clamp-3">{card.preview_text}</p>
          )}
        </div>
        {typeof card.proficiency_pct === "number" && (
          <div className="shrink-0 text-center">
            <span className="text-lg font-bold text-accent">{card.proficiency_pct}%</span>
            <p className="text-[9px] uppercase tracking-wider text-muted">proficiency</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted">
        {card.duration_min && <span>{card.duration_min} min</span>}
        {card.weak_prereq && <span>· Weak prereq: {card.weak_prereq}</span>}
      </div>
    </div>
  );
}
