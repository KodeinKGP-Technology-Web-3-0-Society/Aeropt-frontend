"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAgentStatus,
  type AgentCard,
  type AgentStatusPayload,
} from "@/lib/agent";

const AGENT_ICONS: Record<string, string> = {
  tutor: "📘",
  syllabus: "🗺️",
  doubt_resolver: "💡",
  practice_coach: "🎯",
  mentor_briefing: "📋",
};

type AgentRosterPanelProps = {
  userId: string | null;
  sessionId?: string | null;
  roadmapConceptId?: string | null;
  primaryConceptId?: string | null;
  focusChapters?: string[];
  activeAgent?: string | null;
  refreshKey?: number;
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function AgentRosterPanel({
  userId,
  sessionId,
  roadmapConceptId,
  primaryConceptId,
  focusChapters,
  activeAgent,
  refreshKey = 0,
  collapsed = false,
  onToggle,
}: AgentRosterPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AgentStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchAgentStatus({
        userId,
        sessionId,
        roadmapConceptId,
        primaryConceptId,
        activeAgent,
        focusChapters,
      });
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [userId, sessionId, roadmapConceptId, primaryConceptId, activeAgent, focusChapters]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, refreshKey]);

  useEffect(() => {
    if (!userId) return;
    const timer = window.setInterval(() => void loadStatus(), 60_000);
    return () => window.clearInterval(timer);
  }, [userId, loadStatus]);

  const highlight = activeAgent ?? status?.active_agent ?? null;
  const agents: AgentCard[] = status?.agents ?? [];

  function handleCardClick(card: AgentCard) {
    if (card.id === "syllabus") {
      router.push("/roadmap");
      return;
    }
    if (card.id === "practice_coach") {
      router.push("/practice");
    }
  }

  if (collapsed) {
    return (
      <aside className="agent-roster agent-roster--collapsed" aria-label="Agent roster">
        <button type="button" className="agent-roster__expand" onClick={onToggle}>
          Agents
        </button>
      </aside>
    );
  }

  return (
    <aside className="agent-roster" aria-label="Agent roster">
      <div className="agent-roster__head">
        <div>
          <p className="agent-roster__eyebrow">Agents</p>
          <h2 className="agent-roster__title">Study team</h2>
        </div>
        {onToggle ? (
          <button type="button" className="agent-roster__collapse" onClick={onToggle} aria-label="Collapse agent panel">
            ×
          </button>
        ) : null}
      </div>
      {loading && agents.length === 0 ? (
        <p className="agent-roster__loading">Loading agents…</p>
      ) : null}
      <div className="agent-roster__list">
        {agents.map((card) => {
          const isActive = card.id === highlight || card.status === "active";
          return (
            <button
              key={card.id}
              type="button"
              className={`agent-roster__card ${isActive ? "agent-roster__card--active" : ""}`}
              onClick={() => handleCardClick(card)}
            >
              <span className="agent-roster__icon" aria-hidden>
                {AGENT_ICONS[card.id] ?? "🤖"}
              </span>
              <span className="agent-roster__body">
                <span className="agent-roster__name">{card.name}</span>
                <span className="agent-roster__desc">{card.description}</span>
                <span className={`agent-roster__signal agent-roster__signal--${card.signal_type}`}>
                  {card.signal}
                </span>
              </span>
              <span className={`agent-roster__badge ${isActive ? "agent-roster__badge--active" : ""}`}>
                {isActive ? "Active" : "Idle"}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
