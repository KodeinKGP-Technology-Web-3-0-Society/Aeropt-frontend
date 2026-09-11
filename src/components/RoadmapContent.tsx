"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SUBJECT,
  LearningPath,
  PathNode,
  StageProgressItem,
  buildContinueChatUrl,
  chapterMasteryPct,
  fetchRoadmap,
  fetchRoadmapSubjects,
  formatProficiencyLabel,
  groupNodesByChapter,
  nodeStageProgress,
  resolveNodeEntry,
} from "@/lib/roadmap";
import { cacheKey, invalidateCache } from "@/lib/apiCache";

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
    return "border-accent/40 bg-accent/10 text-accent";
  }
  switch (status) {
    case "in_progress":
      return "border-accent/40 bg-accent/10 text-accent";
    case "completed":
      return "border-emerald-500/30 bg-emerald-950/30 text-emerald-400";
    case "skipped":
      return "border-slate-500/20 bg-slate-900/20 text-muted";
    default:
      return "border-slate-500/20 bg-transparent text-muted";
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
            <span className="text-[10px] dark:text-ink-2 text-slate-300" aria-hidden>
              →
            </span>
          )}
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              item.state === "done"
                ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-400"
                : item.state === "current"
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-slate-500/20 dark:text-muted text-muted"
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
  // The tutor has no seeded content for this concept yet — opening it would
  // dead-end on "this looks outside the syllabus I cover", so say so here
  // rather than handing over a button that goes nowhere.
  const notReady = node.content_ready === false;
  const actionable = node.status !== "skipped" && !notReady;

  return (
    <div
      className={`relative flex gap-3 p-3.5 rounded-xl border transition-all ${
        isCurrent
          ? "border-accent/50 bg-accent-soft shadow-none"
          : "border-line bg-surface"
      }`}
    >
      <div
        className={`mt-1.5 h-3 w-3 rounded-full flex-none ${
          node.status === "in_progress" || isUpNext
            ? "bg-accent shadow-none"
            : node.status === "completed"
              ? "bg-emerald-400"
              : node.status === "skipped"
                ? "bg-slate-600"
                : "bg-hover bg-slate-300"
        }`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-ink-2 leading-snug">
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
                  : "dark:text-muted text-muted"
          }`}
        >
          {formatNodeType(node.node_type)} · {node.estimated_minutes} min · Mastery:{" "}
          {formatProficiencyLabel(node)}
        </p>
        {stages.length > 0 && !notReady && <StageStrip items={stages} />}
        {notReady && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-line bg-hover px-2 py-1 text-[11px] font-semibold text-muted">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-muted" />
            Lessons being prepared
          </p>
        )}
        {actionable && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onContinue(node)}
              aria-label={`${entry.label} for ${node.concept_name}`}
              className={`min-h-10 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                isPrimary
                  ? "bg-accent hover:bg-accent-hover text-white shadow-none"
                  : "border border-line text-accent hover:border-accent/50 dark:hover:bg-[#121126] hover:bg-accent-soft"
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

  if (loading) {
    return (
      <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto animate-pulse">
        <div className="h-7 w-48 bg-hover rounded-lg mb-2" />
        <div className="h-4 w-72 bg-hover/60 rounded mb-8" />
        <div className="h-24 bg-surface border border-line rounded-xl mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-surface border border-line rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto flex items-center justify-center">
        <div className="bg-surface border border-red-900/30 rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <h3 className="text-base font-bold text-ink mb-2">Failed to Load Roadmap</h3>
          <p className="text-xs text-muted mb-5">{error}</p>
          <button
            type="button"
            onClick={() => loadRoadmap()}
            className="min-h-10 bg-accent hover:bg-accent-hover text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap || roadmap.nodes.length === 0) {
    return (
      <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto flex items-center justify-center">
        <div className="bg-surface border border-line rounded-2xl p-8 shadow-xl max-w-md w-full text-center">
          <h3 className="text-base font-bold text-ink mb-2">No path yet</h3>
          <p className="text-xs text-muted mb-5">
            We couldn&apos;t find a learning path for your account. Try generating one, or return to the
            dashboard after onboarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleRebuildPath}
              disabled={regenerating}
              className="min-h-10 bg-accent hover:bg-accent-hover text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {regenerating ? "Building..." : "Build path"}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center min-h-10 text-xs font-semibold px-5 py-2.5 rounded-lg border border-line text-ink-2"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const current = roadmap.current_node;
  // Don't offer the hero CTA for a concept the tutor can't teach yet.
  const currentEntry =
    current && current.content_ready !== false ? resolveNodeEntry(current) : null;

  return (
    <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">
            Your Roadmap
          </h1>
          <p className="text-xs text-muted font-medium mt-1">
            {roadmap.active_nodes} concepts · ~{roadmap.estimated_weeks} weeks at{" "}
            {roadmap.daily_goal_minutes} min/day
          </p>
          {subjects.length > 1 && (
            <div
              role="tablist"
              aria-label="Roadmap subject"
              className="mt-3 inline-flex rounded-lg border border-line bg-surface p-0.5"
            >
              {subjects.map((s) => {
                const active = s === subject;
                return (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSubject(s)}
                    className={`min-h-9 rounded-[7px] px-3.5 text-xs font-semibold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      active
                        ? "bg-accent text-accent-on"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRebuildPath}
            disabled={regenerating}
            className="min-h-10 text-xs font-semibold px-4 py-2 rounded-lg border border-line dark:text-muted text-ink-2 hover:border-accent/40 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {regenerating ? "Rebuilding..." : "Rebuild path"}
          </button>
          {current && currentEntry && (
            <button
              type="button"
              onClick={() => handleContinue(current)}
              className="inline-flex items-center justify-center min-h-10 gap-2 bg-accent hover:bg-accent-hover text-white font-semibold text-xs tracking-wide px-5 py-2.5 rounded-lg shadow-none transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {currentEntry.heroLabel}
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider">
              Journey progress
            </p>
            <p className="text-2xl font-extrabold text-ink mt-1">
              {roadmap.progress_pct}%
            </p>
          </div>
          {current && (
            <div className="flex-1 max-w-xl rounded-xl border border-line bg-hover p-4">
              <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">
                {heroFocusLabel(current)}
              </p>
              <p className="text-sm font-bold text-ink">{current.concept_name}</p>
              <p className="text-xs dark:text-muted text-muted mt-0.5">
                {current.chapter} · {formatNodeType(current.node_type)}
              </p>
              {current.content_ready === false ? (
                <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-muted">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-muted" />
                  Lessons being prepared
                </p>
              ) : (
                <StageStrip items={nodeStageProgress(current)} />
              )}
            </div>
          )}
        </div>
        <div className="w-full bg-hover h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-accent rounded-full transition-all duration-700"
            style={{ width: `${roadmap.progress_pct}%` }}
          />
        </div>
        <p className="text-[10px] dark:text-muted text-muted mt-2 font-medium">
          {roadmap.total_nodes} nodes total · {roadmap.active_nodes} on your active path
        </p>
      </div>

      <div className="space-y-4">
        {chapters.map((chapter) => {
          const expanded = expandedChapters[chapter.name] ?? true;
          return (
            <section
              key={chapter.name}
              className="bg-surface border border-line rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleChapter(chapter.name)}
                aria-expanded={expanded}
                className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <div>
                  <h2 className="text-sm font-bold text-ink">{chapter.name}</h2>
                  <p className="text-[11px] dark:text-muted text-muted font-medium mt-0.5">
                    {chapter.activeCount} concepts on path
                    {chapter.fullyDone ? " · completed" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-ink-2">
                      {chapter.completePct}%
                    </span>
                    <p className="text-[10px] dark:text-muted text-muted uppercase tracking-wider">
                      Chapter complete
                    </p>
                  </div>
                  <span
                    className="text-sm text-muted w-5 text-center"
                    aria-hidden
                  >
                    {expanded ? "▾" : "▸"}
                  </span>
                </div>
              </button>
              {expanded && (
                <div className="px-5 pb-5 space-y-2 border-t border-line pt-4">
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

      <p className="text-center text-[10px] dark:text-ink-2 text-muted mt-8">
        Chemistry and Mathematics roadmaps are coming soon.{" "}
        <Link href="/dashboard" className="text-accent hover:underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
