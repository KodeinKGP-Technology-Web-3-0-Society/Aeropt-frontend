"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { apiRequest, getApiBaseUrl } from "@/lib/api/auth";
import { CacheTTL, cacheKey, cachedGet, peekCache } from "@/lib/api/apiCache";
import {
  DEFAULT_SUBJECT,
  LearningPath,
  buildContinueChatUrl,
  fetchRoadmap,
  resolveNodeEntry,
} from "@/lib/api/roadmap";
import { fetchReadiness, fetchSandboxQueue, type SandboxAction } from "@/lib/api/sandbox";
import { fetchDailyBriefing } from "@/lib/api/agent";

export type StudyIntent = "learn" | "revise" | "practice";

function parseStatNumber(value: string): number {
  const n = parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function daysUntil(dateIso: string): number {
  const target = new Date(dateIso).getTime();
  return Math.max(0, Math.ceil((target - Date.now()) / 86_400_000));
}

/**
 * Everything the dashboard does that is not rendering: the three parallel fetches,
 * the derived stat numbers, and the navigations into a chat session.
 */
export function useDashboardState() {
  const router = useRouter();
  const { data, setData, setQuizActive } = useApp();
  const cachedRoadmap = peekCache<LearningPath>(cacheKey(["roadmap", DEFAULT_SUBJECT]));
  const [loading, setLoading] = useState(!cachedRoadmap);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<LearningPath | null>(cachedRoadmap);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [coachBriefing, setCoachBriefing] = useState<string | null>(null);
  const [sandboxQueue, setSandboxQueue] = useState<SandboxAction[]>([]);
  const [sandboxLoading, setSandboxLoading] = useState(true);

  useEffect(() => {
    void fetchDailyBriefing().then((payload) => {
      if (payload?.briefing_text) setCoachBriefing(payload.briefing_text);
    });
    void fetchSandboxQueue()
      .then((payload) => setSandboxQueue(payload.queue ?? []))
      .catch(() => setSandboxQueue([]))
      .finally(() => setSandboxLoading(false));
  }, []);

  const fetchDashboard = useCallback(() => {
    const warm =
      Boolean(peekCache(cacheKey(["dashboard"]))) ||
      Boolean(peekCache(cacheKey(["roadmap", DEFAULT_SUBJECT])));
    setLoading(!warm);
    setError(null);

    const url = `${getApiBaseUrl()}/analytics/dashboard/`;

    Promise.all([
      cachedGet(cacheKey(["dashboard"]), CacheTTL.dashboard, () =>
        apiRequest<typeof data.dashboard>(url)
      ),
      fetchRoadmap().catch(() => null),
      fetchReadiness().catch(() => null),
    ])
      .then(([resData, roadmapData, readinessData]) => {
        setData((prev) => ({
          ...prev,
          dashboard: resData,
        }));
        setRoadmap(roadmapData);
        setReadiness(readinessData?.overall ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      });
  }, [setData]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const { stats } = data.dashboard;
  const currentNode = roadmap?.current_node ?? null;
  const firstName = (() => {
    const raw = data.user.name.trim().split(/\s+/)[0] || "there";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();
  const jeeDays = daysUntil("2027-01-22");
  const primaryLabel = currentNode ? resolveNodeEntry(currentNode).heroLabel : "Start theory";
  const proficiencyStat = stats.find((s) => s.id === "proficiency");
  const weakStat = stats.find((s) => s.id === "weak_concepts");
  const streakStat = stats.find((s) => s.id === "streak");
  const proficiencyN = proficiencyStat ? parseStatNumber(proficiencyStat.value) : 0;
  const weakN = weakStat ? parseStatNumber(weakStat.value) : 0;
  const streakN = streakStat ? parseStatNumber(streakStat.value) : 0;
  const overviewEmpty = proficiencyN === 0 && weakN === 0 && streakN === 0 && !(weakStat?.list?.length);

  function startSession() {
    setQuizActive(true);
    router.push("/chat");
  }

  function continueLearning() {
    if (currentNode) {
      router.push(buildContinueChatUrl(currentNode));
      return;
    }
    startSession();
  }

  function openConceptChat(conceptName: string, weak = false) {
    if (weak) setQuizActive(true);
    const node = roadmap?.nodes.find((n) => n.concept_name === conceptName) ?? null;
    const stage = weak ? "practice" : "theory";
    const params = new URLSearchParams({
      prompt: weak ? `Help me improve at ${conceptName}` : `Explain ${conceptName}`,
      stage,
      fresh: "1",
    });
    if (node) {
      params.set("concept_id", node.concept_id);
      params.set("node_id", node.id);
      params.set(
        "prompt",
        weak ? `Give me a practice question on ${conceptName}` : `Explain ${conceptName}`
      );
    }
    router.push(`/chat?${params.toString()}`);
  }

  function startCustomSession(intent: StudyIntent, subjectLabel: string, topic: string) {
    const stage = intent === "practice" ? "practice" : intent === "revise" ? "example" : "theory";
    const prompt =
      intent === "learn"
        ? `Teach me ${topic} in ${subjectLabel} from the beginning as a complete new topic.`
        : intent === "revise"
          ? `Help me revise ${topic} in ${subjectLabel}. Cover the key ideas and a short recap.`
          : `Give me practice questions on ${topic} in ${subjectLabel}.`;
    const node = roadmap?.nodes.find((n) => n.concept_name.toLowerCase() === topic.toLowerCase());
    const params = new URLSearchParams({ prompt, stage, fresh: "1" });
    if (node) {
      params.set("concept_id", node.concept_id);
      params.set("node_id", node.id);
    }
    if (intent === "practice") setQuizActive(true);
    router.push(`/chat?${params.toString()}`);
  }

  function startQuickPrompt(prompt: string, stage: string) {
    const params = new URLSearchParams({ prompt, stage, fresh: "1" });
    router.push(`/chat?${params.toString()}`);
  }

  return {
    router,
    loading,
    error,
    fetchDashboard,
    roadmap,
    currentNode,
    readiness,
    coachBriefing,
    sandboxQueue,
    sandboxLoading,
    firstName,
    jeeDays,
    primaryLabel,
    proficiencyStat,
    weakStat,
    streakStat,
    weakN,
    streakN,
    overviewEmpty,
    continueLearning,
    openConceptChat,
    startCustomSession,
    startQuickPrompt,
  };
}
