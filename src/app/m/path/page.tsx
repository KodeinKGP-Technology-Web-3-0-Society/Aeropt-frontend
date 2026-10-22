"use client";

import React, { useState } from "react";
import { AppShell } from "@/native/shell/AppShell";
import { Check, Lock, Play, Star } from "lucide-react";
import { NativeHaptics } from "@/native/platform";

interface PathNode {
  id: string;
  title: string;
  subtitle: string;
  status: "completed" | "current" | "locked";
  subject: "physics" | "chemistry" | "maths";
}

const SAMPLE_NODES: PathNode[] = [
  {
    id: "1",
    title: "Kinematics & Vectors",
    subtitle: "Motion in 1D & 2D",
    status: "completed",
    subject: "physics",
  },
  {
    id: "2",
    title: "Newton's Laws of Motion",
    subtitle: "Friction & Constraint equations",
    status: "completed",
    subject: "physics",
  },
  {
    id: "3",
    title: "Work, Energy & Power",
    subtitle: "Conservative forces & Work-Energy theorem",
    status: "completed",
    subject: "physics",
  },
  {
    id: "4",
    title: "Rotational Motion",
    subtitle: "Torque, Angular Momentum & Rolling",
    status: "current",
    subject: "physics",
  },
  {
    id: "5",
    title: "Gravitation",
    subtitle: "Kepler's laws & Gravitational potential",
    status: "locked",
    subject: "physics",
  },
  {
    id: "6",
    title: "Simple Harmonic Motion",
    subtitle: "Oscillations & Damped SHM",
    status: "locked",
    subject: "physics",
  },
];

export default function MobilePathScreen() {
  const [selectedSubject, setSelectedSubject] = useState<"physics" | "chemistry" | "maths">("physics");

  const handleNodeClick = (node: PathNode) => {
    if (node.status === "locked") {
      void NativeHaptics.notification("warning");
      return;
    }
    void NativeHaptics.impact(node.status === "current" ? "medium" : "light");
  };

  return (
    <AppShell
      header={
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">Learning Path</h2>
              <p className="text-[11px] text-[#64748b]">JEE Main & Advanced Roadmap</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#0d9488] bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/80">
              <Star className="w-3.5 h-3.5 fill-[#0d9488]" />
              <span>4 / 18 Chapters</span>
            </div>
          </div>

          {/* Subject Switcher Chips */}
          <div className="flex gap-2">
            {(["physics", "chemistry", "maths"] as const).map((subject) => {
              const active = selectedSubject === subject;
              return (
                <button
                  key={subject}
                  onClick={() => {
                    void NativeHaptics.selection();
                    setSelectedSubject(subject);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all select-none ${
                    active
                      ? "bg-[#0f172a] text-white shadow-xs"
                      : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]"
                  }`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>
      }
    >
      <div className="px-6 py-6 flex flex-col items-center">
        {/* Vertical Path of Nodes */}
        <div className="relative flex flex-col items-center w-full max-w-xs">
          {SAMPLE_NODES.map((node, index) => {
            const isLast = index === SAMPLE_NODES.length - 1;
            // Alternating serpentine offset: -24px, 0, 24px, 0
            const offset = index % 4 === 1 ? -28 : index % 4 === 3 ? 28 : 0;

            return (
              <div
                key={node.id}
                className="relative flex flex-col items-center my-3 w-full"
                style={{ transform: `translateX(${offset}px)` }}
              >
                {/* Connecting Line between nodes */}
                {!isLast && (
                  <div
                    className={`absolute top-12 left-1/2 -translate-x-1/2 w-1.5 h-16 rounded-full -z-0 ${
                      node.status === "completed"
                        ? "bg-[#0d9488]"
                        : "bg-[#e2e8f0]"
                    }`}
                  />
                )}

                {/* Node Button */}
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center relative transition-transform active:scale-95 shadow-md z-10 select-none ${
                    node.status === "completed"
                      ? "bg-[#0d9488] text-white"
                      : node.status === "current"
                      ? "bg-[#0f172a] text-teal-300 ring-4 ring-teal-500/30 animate-pulse"
                      : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                  }`}
                >
                  {node.status === "completed" ? (
                    <Check className="w-6 h-6 stroke-[3]" />
                  ) : node.status === "current" ? (
                    <Play className="w-6 h-6 fill-current" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </button>

                {/* Node Label Card */}
                <div className="mt-2 text-center max-w-[160px]">
                  <p
                    className={`text-xs font-bold ${
                      node.status === "current"
                        ? "text-[#0d9488]"
                        : node.status === "completed"
                        ? "text-[#0f172a]"
                        : "text-[#94a3b8]"
                    }`}
                  >
                    {node.title}
                  </p>
                  <p className="text-[10px] text-[#64748b] truncate mt-0.5">
                    {node.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
