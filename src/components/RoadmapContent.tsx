"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LearningPath,
  PathNode,
  StageProgressItem,
  buildContinueChatUrl,
  chapterMasteryPct,
  fetchRoadmap,
  formatProficiencyLabel,
  groupNodesByChapter,
  nodeStageProgress,
  resolveNodeEntry,
} from "@/lib/roadmap";
import { invalidateCache } from "@/lib/apiCache";

function formatNodeType(nodeType: string): string {
  if (!nodeType) return "Learn";
  return nodeType.charAt(0).toUpperCase() + nodeType.slice(1).toLowerCase();
}

function statusLabel(status: PathNode["status"], isUpNext: boolean): string {
  if (isUpNext && status === "pending") return "Up next";
  switch (status) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Done";
    case "skipped":
      return "Skipped";
    default:
      return "Queued";
  }
}

function statusClasses(status: PathNode["status"], isUpNext: boolean): string {
  if (isUpNext && status === "pending") {
    return "border-[#6258ff]/40 bg-[#6258ff]/10 text-[#8584ff]";
  }
  switch (status) {
    case "in_progress":
      return "border-[#6258ff]/40 bg-[#6258ff]/10 text-[#8584ff]";
    case "completed":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-400";
    case "skipped":
      return "border-slate-500/20 bg-slate-900/20 text-slate-500";
    default:
      return "border-slate-500/20 bg-transparent text-slate-400";
  }
}

function heroFocusLabel(node: PathNode): string {
  switch (node.status) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Review";
    default:
      return "Start next";
  }
}

function StageStrip({ items }: { items: StageProgressItem[] }) {
  return (
    <ol className="mt-2.5 flex flex-wrap items-center gap-1.5" aria-label="Lesson stages">
      {items.map((item, index) => (
        <li key={item.stage} className="flex items-center gap-1.5">
          {index > 0 && (
            <span className="text-[10px] dark:text-slate-600 text-slate-300" aria-hidden>
              →
            </span>
          )}
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              item.state === "done"
                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                : item.state === "current"
                  ? "border-[#6258ff]/50 bg-[#6258ff]/15 text-[#8584ff]"
                  : "border-slate-500/20 dark:text-slate-500 text-slate-400"
            }`}
          >
            {item.label}
            {item.state === "done" ? " ✓" : item.state === "current" ? " ●" : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}

function NodeCard({
  node,
  isUpNext,
  isPrimary,
  onContinue,
}: {
  node: PathNode;
  isUpNext: boolean;
  isPrimary: boolean;
  onContinue: (node: PathNode) => void;
}) {
  const entry = resolveNodeEntry(node);
  const isCurrent = node.status === "in_progress" || isUpNext;
  const showStages = node.status === "in_progress" || isUpNext || node.status === "completed";
  const stages = showStages ? nodeStageProgress(node) : [];
  const actionable = node.status !== "skipped";

  return (
    <div
      className={`relative flex gap-3 p-3.5 rounded-xl border transition-all ${
        isCurrent
          ? "dark:border-[#6258ff]/50 border-indigo-300 dark:bg-[#121126]/60 bg-indigo-50/50 shadow-[0_0_20px_rgba(98,88,255,0.08)]"
          : "dark:border-[#1b1c2b] border-slate-200 dark:bg-[#080911]/40 bg-white"
      }`}
    >
      <div
        className={`mt-1.5 h-3 w-3 rounded-full flex-none ${
          node.status === "in_progress" || isUpNext
            ? "bg-[#6258ff] shadow-[0_0_10px_rgba(98,88,255,0.6)]"
            : node.status === "completed"
              ? "bg-emerald-400"
              : node.status === "skipped"
                ? "bg-slate-600"
                : "dark:bg-[#1b1c2b] bg-slate-300"
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold dark:text-slate-200 text-slate-800 leading-snug">
            {node.concept_name}
          </p>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded border flex-none ${statusClasses(node.status, isUpNext)}`}
          >
            {statusLabel(node.status, isUpNext)}
          </span>
        </div>
        <p
          className={`mt-1.5 text-xs font-medium ${
            node.proficiency_display === "almost_mastered"
              ? "text-amber-500"
              : node.proficiency_display === "strong" || node.proficiency_display === "mastered"
                ? "text-emerald-500"
                : node.proficiency_display === "weak"
                  ? "text-red-400"
                  : "dark:text-slate-500 text-slate-500"
          }`}
        >
          {formatNodeType(node.node_type)} · {node.estimated_minutes} min · Mastery:{" "}
          {formatProficiencyLabel(node)}
        </p>
        {stages.length > 0 && <StageStrip items={stages} />}
        {actionable && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onContinue(node)}
              aria-label={`${entry.label} for ${node.concept_name}`}
              className={`min-h-10 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0d0e16] ${
                isPrimary
                  ? "bg-[#6258ff] hover:bg-[#5045ff] text-white shadow-[0_2px_12px_rgba(98,88,255,0.25)]"
                  : "border dark:border-[#2a2b3d] border-slate-200 text-[#8584ff] hover:border-[#6258ff]/50 dark:hover:bg-[#121126] hover:bg-indigo-50/80"
              }`}
            >
              {entry.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function chapterIsFullyDone(nodes: PathNode[]): boolean {
  return nodes.length > 0 && nodes.every((n) => n.status === "completed" || n.status === "skipped");
}

function chapterHasInProgress(nodes: PathNode[]): boolean {
  return nodes.some((n) => n.status === "in_progress");
}

export default function RoadmapContent() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const loadRoadmap = useCallback((regenerate = false, silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    if (regenerate) setRegenerating(true);

    fetchRoadmap(regenerate)
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
  }, []);

  useEffect(() => {
    invalidateCache("roadmap");
    loadRoadmap();
  }, [loadRoadmap]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      invalidateCache("roadmap");
      loadRoadmap(false, true);
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

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen animate-pulse">
        <div className="h-7 w-48 dark:bg-[#1b1c2b] bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-72 dark:bg-[#1b1c2b] bg-slate-200/60 rounded mb-8" />
        <div className="h-24 dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen flex items-center justify-center">
        <div className="dark:bg-[#0d0e16] bg-white border border-red-900/30 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <h3 className="text-base font-bold dark:text-white text-slate-900 mb-2">Failed to Load Roadmap</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mb-5">{error}</p>
          <button
            type="button"
            onClick={() => loadRoadmap()}
            className="min-h-10 bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap || roadmap.nodes.length === 0) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen flex items-center justify-center">
        <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <h3 className="text-base font-bold dark:text-white text-slate-900 mb-2">No path yet</h3>
          <p className="text-xs dark:text-slate-400 text-slate-500 mb-5">
            We couldn&apos;t find a learning path for your account. Try generating one, or return to the
            dashboard after onboarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleRebuildPath}
              disabled={regenerating}
              className="min-h-10 bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff]"
            >
              {regenerating ? "Building..." : "Build path"}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center min-h-10 text-xs font-semibold px-5 py-2.5 rounded-lg border dark:border-[#1b1c2b] border-slate-200 dark:text-slate-300 text-slate-700"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = roadmap.current_node;
  const currentEntry = current ? resolveNodeEntry(current) : null;

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight dark:text-white text-slate-900">
            Your Roadmap
          </h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 font-medium mt-1">
            {roadmap.active_nodes} concepts · ~{roadmap.estimated_weeks} weeks at{" "}
            {roadmap.daily_goal_minutes} min/day
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRebuildPath}
            disabled={regenerating}
            className="min-h-10 text-xs font-semibold px-4 py-2 rounded-lg border dark:border-[#1b1c2b] border-slate-200 dark:text-slate-400 text-slate-600 hover:border-[#6258ff]/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff]"
          >
            {regenerating ? "Rebuilding..." : "Rebuild path"}
          </button>
          {current && currentEntry && (
            <button
              type="button"
              onClick={() => handleContinue(current)}
              className="inline-flex items-center justify-center min-h-10 gap-2 bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs tracking-wide px-5 py-2.5 rounded-lg shadow-[0_4px_18px_rgba(98,88,255,0.25)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8584ff] focus-visible:ring-offset-2"
            >
              {currentEntry.heroLabel}
            </button>
          )}
        </div>
      </div>

      <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              Journey progress
            </p>
            <p className="text-2xl font-extrabold dark:text-white text-slate-900 mt-1">
              {roadmap.progress_pct}%
            </p>
          </div>
          {current && (
            <div className="dark:bg-[#07080d] bg-slate-50 border dark:border-[#1b1c2b] border-slate-200 rounded-xl p-4 flex-1 max-w-xl">
              <p className="text-[11px] font-bold text-[#8584ff] uppercase tracking-wider mb-1">
                {heroFocusLabel(current)}
              </p>
              <p className="text-sm font-bold dark:text-white text-slate-900">{current.concept_name}</p>
              <p className="text-xs dark:text-slate-500 text-slate-500 mt-0.5">
                {current.chapter} · {formatNodeType(current.node_type)}
              </p>
              <StageStrip items={nodeStageProgress(current)} />
            </div>
          )}
        </div>
        <div className="w-full dark:bg-[#121126] bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#6258ff] to-[#8584ff] rounded-full transition-all duration-700"
            style={{ width: `${roadmap.progress_pct}%` }}
          />
        </div>
        <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-2 font-medium">
          {roadmap.total_nodes} nodes total · {roadmap.active_nodes} on your active path
        </p>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter) => {
          const expanded = expandedChapters[chapter.name] ?? true;
          return (
            <section
              key={chapter.name}
              className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleChapter(chapter.name)}
                aria-expanded={expanded}
                className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8584ff]"
              >
                <div>
                  <h2 className="text-sm font-bold dark:text-white text-slate-900">{chapter.name}</h2>
                  <p className="text-[11px] dark:text-slate-500 text-slate-500 font-medium mt-0.5">
                    {chapter.activeCount} concepts on path
                    {chapter.fullyDone ? " · completed" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-extrabold dark:text-slate-300 text-slate-700">
                      {chapter.completePct}%
                    </span>
                    <p className="text-[10px] dark:text-slate-500 text-slate-500 uppercase tracking-wider">
                      Chapter complete
                    </p>
                  </div>
                  <span
                    className="text-sm dark:text-slate-400 text-slate-500 w-5 text-center"
                    aria-hidden
                  >
                    {expanded ? "▾" : "▸"}
                  </span>
                </div>
              </button>
              {expanded && (
                <div className="px-5 pb-5 space-y-2 border-t dark:border-[#1b1c2b] border-slate-200 pt-4">
                  {chapter.nodes.map((node) => {
                    const isUpNext = node.id === upNextNodeId && node.status === "pending";
                    const isPrimary =
                      node.id === upNextNodeId ||
                      node.status === "in_progress" ||
                      (current?.id === node.id && node.status !== "skipped");
                    return (
                      <NodeCard
                        key={node.id}
                        node={node}
                        isUpNext={isUpNext}
                        isPrimary={isPrimary}
                        onContinue={handleContinue}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="text-center text-[10px] dark:text-slate-600 text-slate-400 mt-8">
        Chemistry and Mathematics roadmaps are coming soon.{" "}
        <Link href="/dashboard" className="text-[#8584ff] hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
