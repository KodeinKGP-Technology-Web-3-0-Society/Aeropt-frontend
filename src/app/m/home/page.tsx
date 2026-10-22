"use client";

import React from "react";
import { AppShell } from "@/native/shell/AppShell";
import { NativeButton } from "@/native/ui/NativeButton";
import { Flame, Target, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MobileHomeScreen() {
  const router = useRouter();

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0f172a] flex items-center justify-center text-white font-bold text-sm">
              JP
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">JEEPath</h2>
              <p className="text-[11px] text-[#64748b]">Ready for JEE 2027</p>
            </div>
          </div>

          {/* Streak indicator badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>3 days</span>
          </div>
        </div>
      }
    >
      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Daily Goal & Continue Hero Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0d9488] uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Daily Goal · 2 of 3 done</span>
            </div>
            <span className="text-xs font-semibold text-[#64748b]">66%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#f1f5f9] h-2 rounded-full overflow-hidden">
            <div className="bg-[#0d9488] h-full rounded-full transition-all duration-300 w-2/3" />
          </div>

          <div className="pt-1">
            <h3 className="text-lg font-bold text-[#0f172a]">Continue Torque</h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Rotational Motion · Part 2 of 4
            </p>
          </div>

          <NativeButton
            variant="primary"
            size="md"
            fullWidth
            onClick={() => router.push("/m/doubt")}
            className="mt-1"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Lesson
          </NativeButton>
        </div>

        {/* Today's 3 Focus Items */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Today&apos;s Focus
            </h4>
            <span className="text-[11px] font-medium text-[#0d9488]">3 tasks</span>
          </div>

          {/* Task 1 */}
          <div
            onClick={() => router.push("/m/path")}
            className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between active:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200/80 text-[#0d9488] flex items-center justify-center font-bold text-xs">
                PHY
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Moment of Inertia</p>
                <p className="text-xs text-[#64748b]">5 practice questions</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </div>

          {/* Task 2 */}
          <div
            onClick={() => router.push("/m/doubt")}
            className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between active:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Review Past Doubts</p>
                <p className="text-xs text-[#64748b]">Calculus definite integrals</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </div>

          {/* Task 3 */}
          <div
            onClick={() => router.push("/m/path")}
            className="bg-white p-3.5 rounded-xl border border-[#e2e8f0] flex items-center justify-between active:bg-[#f8fafc] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center font-bold text-xs">
                CHM
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">Thermodynamics Quiz</p>
                <p className="text-xs text-[#64748b]">10 min rapid check</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
          </div>
        </div>

        {/* Ask Tutor Quick CTA */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-teal-300">Got a JEE doubt?</p>
              <p className="text-sm font-bold">Ask AI Tutor anytime</p>
            </div>
          </div>
          <NativeButton
            size="sm"
            variant="primary"
            onClick={() => router.push("/m/doubt")}
          >
            Ask
          </NativeButton>
        </div>
      </div>
    </AppShell>
  );
}
