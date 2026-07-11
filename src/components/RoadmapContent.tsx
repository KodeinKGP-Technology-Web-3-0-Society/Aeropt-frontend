"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LearningPath,
  PathNode,
  buildContinueChatUrl,
  chapterMasteryPct,
  fetchRoadmap,
  formatProficiencyLabel,
  groupNodesByChapter,
} from "@/lib/roadmap";

function statusLabel(status: PathNode["status"]): string {
  switch (status) {
    case "in_progress":
      return "In progress";
    case "completed":
      return "Done";
    case "skipped":
      return "Skipped";
    default:
      return "Up next";
  }
}

function statusClasses(status: PathNode["status"]): string {
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

function actionLabel(status: PathNode["status"]): string | null {
  switch (status) {
    case "pending":
      return "Start →";
    case "in_progress":
      return "Continue →";
    case "completed":
      return "Review →";
    default:
      return null;
  }
}

function NodeCard({
  node,
  isActiveChapter,
  onContinue,
}: {
  node: PathNode;
  isActiveChapter: boolean;
  onContinue: (node: PathNode) => void;
}) {
  const isCurrent = node.status === "in_progress";
  const action = isActiveChapter ? actionLabel(node.status) : node.status === "completed" ? "Review →" : null;
  return (
    <div
      className={`relative flex gap-3 p-3 rounded-xl border transition-all ${
        isCurrent
          ? "dark:border-[#6258ff]/50 border-indigo-300 dark:bg-[#121126]/60 bg-indigo-50/50 shadow-[0_0_20px_rgba(98,88,255,0.08)]"
          : "dark:border-[#1b1c2b] border-slate-200 dark:bg-[#080911]/40 bg-white"
      }`}
    >
      <div
        className={`mt-0.5 h-3 w-3 rounded-full flex-none ${
          isCurrent
            ? "bg-[#6258ff] shadow-[0_0_10px_rgba(98,88,255,0.6)]"
            : node.status === "completed"
            ? "bg-emerald-400"
            : node.status === "skipped"
            ? "bg-slate-600"
            : "dark:bg-[#1b1c2b] bg-slate-300"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold dark:text-slate-200 text-slate-800 truncate">{node.concept_name}</p>
          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border flex-none ${statusClasses(node.status)}`}>
            {statusLabel(node.status)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] dark:text-slate-500 text-slate-500 font-medium">
            {node.node_type} · {node.estimated_minutes} min · {formatProficiencyLabel(node)}
          </span>
          {action && (
            <button
              type="button"
              onClick={() => onContinue(node)}
              className="text-[10px] font-bold uppercase tracking-wider text-[#8584ff] hover:text-white transition-colors cursor-pointer"
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoadmapContent() {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const loadRoadmap = useCallback((regenerate = false) => {
    setLoading(true);
    setError(null);
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
    loadRoadmap();
  }, [loadRoadmap]);

  const chapters = useMemo(() => {
    if (!roadmap) return [];
    const grouped = groupNodesByChapter(roadmap.nodes);
    return Object.entries(grouped).map(([name, nodes]) => ({
      name,
      nodes,
      mastery: chapterMasteryPct(nodes),
      activeCount: nodes.filter((n) => n.status !== "skipped").length,
    }));
  }, [roadmap]);

  const activeChapter = useMemo(() => {
    if (!roadmap) return null;
    const current = roadmap.current_node;
    if (current?.chapter) return current.chapter;
    const firstActive = roadmap.nodes.find(
      (n) => n.status === "in_progress" || n.status === "pending"
    );
    return firstActive?.chapter ?? null;
  }, [roadmap]);

  const handleContinue = (node: PathNode) => {
    router.push(buildContinueChatUrl(node));
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen animate-pulse">
        <div className="h-7 w-48 dark:bg-[#1b1c2b] bg-slate-200 rounded-lg mb-2" />
        <div className="h-4 w-72 dark:bg-[#1b1c2b] bg-slate-200/60 rounded mb-8" />
        <div className="h-24 dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl" />
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
            onClick={() => loadRoadmap()}
            className="bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs px-5 py-2.5 rounded-lg cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  const current = roadmap.current_node;

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight dark:text-white text-slate-900">Your Roadmap</h1>
          <p className="text-xs dark:text-slate-400 text-slate-500 font-medium mt-1">
            {roadmap.active_nodes} concepts · ~{roadmap.estimated_weeks} weeks at {roadmap.daily_goal_minutes} min/day
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadRoadmap(true)}
            disabled={regenerating}
            className="text-xs font-semibold px-4 py-2 rounded-lg border dark:border-[#1b1c2b] border-slate-200 dark:text-slate-400 text-slate-600 hover:border-[#6258ff]/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            {regenerating ? "Refreshing..." : "Refresh path"}
          </button>
          {current && (
            <button
              type="button"
              onClick={() => handleContinue(current)}
              className="inline-flex items-center gap-2 bg-[#6258ff] hover:bg-[#5045ff] text-white font-semibold text-xs tracking-wider uppercase px-5 py-2.5 rounded-lg shadow-[0_4px_18px_rgba(98,88,255,0.25)] transition-all cursor-pointer"
            >
              Continue learning
            </button>
          )}
        </div>
      </div>

      <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-[11px] font-bold dark:text-slate-400 text-slate-500 uppercase tracking-wider">Journey progress</p>
            <p className="text-2xl font-extrabold dark:text-white text-slate-900 mt-1">{roadmap.progress_pct}%</p>
          </div>
          {current && (
            <div className="dark:bg-[#07080d] bg-slate-50 border dark:border-[#1b1c2b] border-slate-200 rounded-xl p-4 flex-1 max-w-xl">
              <p className="text-[10px] font-bold text-[#8584ff] uppercase tracking-wider mb-1">Up next</p>
              <p className="text-sm font-bold dark:text-white text-slate-900">{current.concept_name}</p>
              <p className="text-xs dark:text-slate-500 text-slate-500 mt-0.5">{current.chapter} · {current.node_type}</p>
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

      <div className="space-y-6">
        {chapters.map((chapter) => (
          <section
            key={chapter.name}
            className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b dark:border-[#1b1c2b] border-slate-200">
              <div>
                <h2 className="text-sm font-bold dark:text-white text-slate-900">{chapter.name}</h2>
                <p className="text-[10px] dark:text-slate-500 text-slate-500 font-medium mt-0.5">
                  {chapter.activeCount} concepts on path
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold dark:text-slate-300 text-slate-700">{chapter.mastery}%</span>
                <p className="text-[9px] dark:text-slate-500 text-slate-500 uppercase tracking-wider">chapter mastery</p>
              </div>
            </div>
            <div className="space-y-2">
              {chapter.nodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  isActiveChapter={chapter.name === activeChapter}
                  onContinue={handleContinue}
                />
              ))}
            </div>
          </section>
        ))}
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
