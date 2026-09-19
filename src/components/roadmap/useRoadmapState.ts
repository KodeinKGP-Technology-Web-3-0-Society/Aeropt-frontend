"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SUBJECT,
  LearningPath,
  PathNode,
  buildContinueChatUrl,
  chapterMasteryPct,
  fetchRoadmap,
  fetchRoadmapSubjects,
  groupNodesByChapter,
} from "@/lib/api/roadmap";
import { cacheKey, invalidateCache } from "@/lib/api/apiCache";

function chapterIsFullyDone(nodes: PathNode[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.status === "completed" || n.status === "skipped");
}

function chapterHasInProgress(nodes: PathNode[]): boolean {
  return nodes.some((n) => n.status === "in_progress");
}

/**
 * Loading, subject switching, chapter expansion and the navigations out of the
 * roadmap. `RoadmapContent` is left with rendering only.
 */
export function useRoadmapState() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [subject, setSubject] = useState<string>(DEFAULT_SUBJECT);
  const [subjects, setSubjects] = useState<string[]>([DEFAULT_SUBJECT]);

  const loadRoadmap = useCallback(
    (regenerate = false, silent = false, forSubject: string = subject) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      if (regenerate) setRegenerating(true);

      fetchRoadmap(regenerate, forSubject)
        .then((data) => {
          setRoadmap(data);
          setLoading(false);
          setRegenerating(false);
        })
        .catch((err: Error) => {
          setError(err.message || "Failed to load roadmap");
          setLoading(false);
          setRegenerating(false);
        });
    },
    [subject],
  );

  // Which subjects the backend actually has a syllabus for — never hardcoded,
  // so adding a syllabus file server-side surfaces here with no frontend change.
  useEffect(() => {
    fetchRoadmapSubjects()
      .then((list) => {
        if (list.length) setSubjects(list);
      })
      .catch(() => setSubjects([DEFAULT_SUBJECT]));
  }, []);

  useEffect(() => {
    invalidateCache(cacheKey(["roadmap", subject]));
    loadRoadmap(false, false, subject);
  }, [loadRoadmap, subject]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      invalidateCache(cacheKey(["roadmap", subject]));
      loadRoadmap(false, true, subject);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadRoadmap]);

  const chapters = useMemo(() => {
    if (!roadmap) return [];
    const grouped = groupNodesByChapter(roadmap.nodes);
    return Object.entries(grouped).map(([name, nodes]) => ({
      name,
      nodes,
      completePct: chapterMasteryPct(nodes),
      activeCount: nodes.filter((n) => n.status !== "skipped").length,
      fullyDone: chapterIsFullyDone(nodes),
      hasInProgress: chapterHasInProgress(nodes),
    }));
  }, [roadmap]);

  const activeChapter = useMemo(() => {
    if (!roadmap) return null;
    const current = roadmap.current_node;
    if (current?.chapter) return current.chapter;
    const firstActive = roadmap.nodes.find(
      (n) => n.status === "in_progress" || n.status === "pending",
    );
    return firstActive?.chapter ?? null;
  }, [roadmap]);

  // Expand active / in-progress chapters; collapse fully completed by default.
  useEffect(() => {
    if (!chapters.length) return;
    setExpandedChapters((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const chapter of chapters) {
        if (next[chapter.name] !== undefined) continue;
        next[chapter.name] =
          chapter.hasInProgress || chapter.name === activeChapter || !chapter.fullyDone;
      }
      return next;
    });
  }, [chapters, activeChapter]);

  const upNextNodeId = useMemo(() => {
    if (!roadmap) return null;
    if (roadmap.current_node?.status === "pending") return roadmap.current_node.id;
    if (roadmap.current_node?.status === "in_progress") return roadmap.current_node.id;
    const firstPending = roadmap.nodes.find((n) => n.status === "pending");
    return firstPending?.id ?? null;
  }, [roadmap]);

  const handleContinue = (node: PathNode) => {
    router.push(buildContinueChatUrl(node));
  };

  const handleRebuildPath = () => {
    const ok = window.confirm(
      "Rebuild your learning path? Concept order may change. Progress already saved on nodes is kept, but the active path sequence can shift.",
    );
    if (!ok) return;
    loadRoadmap(true);
  };

  const toggleChapter = (name: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [name]: !(prev[name] ?? true),
    }));
  };
  return {
    loadRoadmap,
    roadmap,
    loading,
    error,
    regenerating,
    expandedChapters,
    subject,
    setSubject,
    subjects,
    chapters,
    upNextNodeId,
    handleContinue,
    handleRebuildPath,
    toggleChapter,
  };
}
