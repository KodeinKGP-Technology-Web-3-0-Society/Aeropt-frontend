"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/native/shell/AppShell";
import { useApp } from "@/components/AppContext";
import { Award, Flame, Zap, ShieldCheck, LogOut, ChevronRight, Moon, Settings } from "lucide-react";
import { NativeHaptics } from "@/native/platform";
import { getReducedMotionPref, setReducedMotionPref } from "@/native/store/appPrefs";

export default function MobileMeScreen() {
  const { data, logout } = useApp();
  const user = data?.user;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void (async () => {
      const pref = await getReducedMotionPref();
      setReduceMotion(pref);
    })();
  }, []);

  const handleToggleReduceMotion = async () => {
    const next = !reduceMotion;
    setReduceMotion(next);
    void NativeHaptics.selection();
    await setReducedMotionPref(next);
  };

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0f172a]">My Progress</h2>
          <button
            type="button"
            aria-label="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="px-4 py-5 flex flex-col gap-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-xs flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-bold text-lg">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "JP"}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[#0f172a]">
              {user?.name || "JEE Aspirant"}
            </h3>
            <p className="text-xs text-[#64748b]">{user?.email || "Class 12 · Target 2027"}</p>
          </div>
        </div>

        {/* Readiness Meter Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Overall JEE Readiness
            </span>
            <span className="text-sm font-extrabold text-[#0d9488]">64%</span>
          </div>

          <div className="w-full bg-[#f1f5f9] h-3 rounded-full overflow-hidden">
            <div className="bg-[#0d9488] h-full rounded-full transition-all duration-500 w-[64%]" />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#f1f5f9] text-center">
            <div>
              <p className="text-[11px] text-[#64748b] font-medium">Physics</p>
              <p className="text-sm font-bold text-[#0f172a]">72%</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748b] font-medium">Chemistry</p>
              <p className="text-sm font-bold text-[#0f172a]">58%</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748b] font-medium">Maths</p>
              <p className="text-sm font-bold text-[#0f172a]">63%</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#0f172a]">3 Days</p>
              <p className="text-xs text-[#64748b]">Current Streak</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#0d9488]">
              <Zap className="w-5 h-5 fill-[#0d9488]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#0f172a]">142 Qs</p>
              <p className="text-xs text-[#64748b]">Solved</p>
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Achievements
            </h4>
            <span className="text-[11px] font-medium text-[#0d9488]">2 unlocked</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0f172a]">First Step</p>
                <p className="text-xs text-[#64748b]">Completed 1st practice session</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Settings & Preferences */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b] px-1">
            Preferences
          </h4>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] divide-y divide-[#f1f5f9] overflow-hidden">
            {/* Reduce motion toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-4 h-4 text-[#64748b]" />
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Reduce Motion</p>
                  <p className="text-[11px] text-[#64748b]">Simplify screen transitions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleReduceMotion}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 relative ${
                  reduceMotion ? "bg-[#0d9488]" : "bg-[#cbd5e1]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    reduceMotion ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Sign out */}
            <button
              onClick={() => {
                void NativeHaptics.impact("medium");
                void logout();
              }}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-red-600">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
