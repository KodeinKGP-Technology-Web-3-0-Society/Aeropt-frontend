import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  clearRoadmapSessionBind,
  fetchRoadmap,
  readRoadmapSessionBind,
  updateRoadmapProgress,
  writeRoadmapSessionBind,
  type PathNode,
  type StudyStage,
} from "@/lib/roadmap";
import { fetchConceptProficiency } from "@/lib/agent";

export function useRoadmapBinding(sessionId: string, activeSessionId: string | null) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapConceptId = searchParams.get("concept_id");
  const roadmapNodeId = searchParams.get("node_id");
  const roadmapPrompt = searchParams.get("prompt");
  const initialStage = (searchParams.get("stage") as StudyStage | null) ?? "theory";
  const forceFreshStart = searchParams.get("fresh") === "1";

  const [roadmapNode, setRoadmapNode] = useState<PathNode | null>(null);
  const [contentSequence, setContentSequence] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [conceptComplete, setConceptComplete] = useState(false);
  const [lastProficiencyPct, setLastProficiencyPct] = useState<number | null>(null);
  const [entryNonce, setEntryNonce] = useState(0);
  const [roadmapBindReady, setRoadmapBindReady] = useState(false);

  const progressMarkedRef = useRef(false);
  const autoPromptedRef = useRef(false);
  const startFreshRef = useRef(forceFreshStart);
  const freshUrlHandledRef = useRef(false);

  const isRoadmapSession = Boolean(roadmapNodeId && contentSequence.length > 0);

  const persistRoadmapBind = useCallback(
    (stageIndex: number, overrideSessionId: string | null = activeSessionId) => {
      if (!roadmapNodeId) return;
      writeRoadmapSessionBind(roadmapNodeId, { sessionId: overrideSessionId, stageIndex });
    },
    [roadmapNodeId, activeSessionId],
  );

  useEffect(() => {
    if (!forceFreshStart) {
      freshUrlHandledRef.current = false;
      return;
    }
    if (freshUrlHandledRef.current) return;
    freshUrlHandledRef.current = true;
    startFreshRef.current = true;
    autoPromptedRef.current = false;
    progressMarkedRef.current = false;
    setEntryNonce((n) => n + 1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fresh");
    const qs = params.toString();
    router.replace(qs ? `/chat/${sessionId}?${qs}` : `/chat/${sessionId}`, { scroll: false });
  }, [forceFreshStart, router, searchParams, sessionId]);

  useEffect(() => {
    if (!roadmapNodeId) return;
    const loadNode = async () => {
      try {
        const roadmap = await fetchRoadmap();
        const node = roadmap.nodes.find((item) => item.id === roadmapNodeId) ?? null;
        if (!node) return;
        setRoadmapNode(node);
        if (typeof node.proficiency_pct === "number") {
          setLastProficiencyPct((current) => (current != null ? current : node.proficiency_pct));
        }
        const sequence = node.content_sequence?.length
          ? node.content_sequence
          : ["theory", "example", "practice", "pyq"];
        setContentSequence(sequence);
        const bind = !startFreshRef.current ? readRoadmapSessionBind(roadmapNodeId) : null;
        const fromUrl = Math.max(0, sequence.indexOf(initialStage));
        const stageIndex =
          bind && bind.stageIndex >= 0 && bind.stageIndex < sequence.length
            ? bind.stageIndex
            : fromUrl >= 0
              ? fromUrl
              : 0;
        setCurrentStageIndex(stageIndex);
        if (!progressMarkedRef.current && node.status !== "completed") {
          progressMarkedRef.current = true;
          await updateRoadmapProgress({ node_id: node.id, status: "in_progress" });
        }
        if (node.status === "completed") {
          setConceptComplete(true);
        }
      } catch {
        setContentSequence(["theory", "example", "practice", "pyq"]);
      }
    };
    void loadNode();
  }, [roadmapNodeId, initialStage, entryNonce]);

  useEffect(() => {
    setRoadmapBindReady(false);
  }, [roadmapNodeId, entryNonce]);

  useEffect(() => {
    if (!roadmapNodeId || !roadmapBindReady) return;
    persistRoadmapBind(currentStageIndex);
  }, [roadmapNodeId, currentStageIndex, roadmapBindReady, persistRoadmapBind]);

  return {
    roadmapConceptId,
    roadmapNodeId,
    roadmapPrompt,
    initialStage,
    roadmapNode,
    contentSequence,
    currentStageIndex,
    setCurrentStageIndex,
    conceptComplete,
    setConceptComplete,
    lastProficiencyPct,
    setLastProficiencyPct,
    isRoadmapSession,
    persistRoadmapBind,
    setRoadmapBindReady,
    entryNonce,
    autoPromptedRef,
    startFreshRef,
  };
}
