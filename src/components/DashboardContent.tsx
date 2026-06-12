"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, Chapter, Concept } from "@/components/AppContext";

export default function DashboardContent() {
  const router = useRouter();
  const { data, setQuizActive } = useApp();
  const [activeTab, setActiveTab] = useState("Laws of Motion");

  const { stats, conceptHealth } = data.dashboard;

  const currentChapter = conceptHealth.chapters.find((ch) => ch.name === activeTab) || conceptHealth.chapters[0];

  const handleStartSession = () => {
    // Navigate to chat and activate diagnostic quiz
    setQuizActive(true);
    router.push("/chat");
  };

  const handleConceptClick = (concept: Concept) => {
    if (concept.tag === "WEAK") {
      setQuizActive(true);
      router.push("/chat");
    } else {
      router.push("/chat");
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white select-none">
            Good morning, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Let's cover your prerequisite gaps today.
          </p>
        </div>
        <button
          onClick={handleStartSession}
          className="inline-flex items-center justify-center gap-2 bg-[#6258ff] hover:bg-[#5045ff] active:scale-[0.98] text-white font-semibold text-xs tracking-wider uppercase px-5 py-2.5 rounded-lg shadow-[0_4px_18px_rgba(98,88,255,0.25)] transition-all cursor-pointer"
        >
          <svg
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-3.5 w-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Start Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => {
          if (stat.id === "proficiency") {
            return (
              <div
                key={stat.id}
                className="bg-[#0d0e16] border border-[#1b1c2b] rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    <h2 className="text-3xl font-extrabold text-white mt-2 mb-1">{stat.value}</h2>
                    <p className="text-xs text-slate-500 font-medium">{stat.subtext}</p>
                  </div>
                  <div className="h-14 w-14 rounded-full border-4 border-[#121126] border-t-[#6258ff] flex items-center justify-center text-[11px] font-bold text-white shadow-[0_0_15px_rgba(98,88,255,0.15)]">
                    {stat.value}
                  </div>
                </div>
              </div>
            );
          }

          if (stat.id === "weak_concepts") {
            return (
              <div
                key={stat.id}
                className="bg-[#0d0e16] border border-[#1b1c2b] rounded-xl p-5 shadow-lg relative overflow-hidden"
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <h2 className="text-3xl font-extrabold text-white mt-2 mb-2">{stat.value}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {stat.list?.map((concept) => (
                      <span
                        key={concept}
                        onClick={() => router.push("/chat")}
                        className="cursor-pointer text-[9px] font-bold text-[#f87171] border border-[#f87171]/20 bg-[#f87171]/5 px-2 py-0.5 rounded hover:bg-[#f87171]/10 transition-colors"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          // Streak Card
          return (
            <div
              key={stat.id}
              className="bg-[#0d0e16] border border-[#1b1c2b] rounded-xl p-5 shadow-lg relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  <h2 className="text-3xl font-extrabold text-white mt-2 mb-1 flex items-center gap-1.5">
                    {stat.value}
                    <span className="text-orange-500 animate-pulse text-2xl">🔥</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{stat.subtext}</p>
                </div>
                {/* Visual streak dots */}
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4, 5].map((day) => (
                    <span
                      key={day}
                      className={`h-2 w-2 rounded-full ${
                        day <= parseInt(stat.value)
                          ? "bg-gradient-to-br from-orange-400 to-red-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                          : "bg-[#1b1c2b]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Physics Concept Health */}
      <div className="bg-[#0d0e16] border border-[#1b1c2b] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1b1c2b] pb-4 mb-6 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{conceptHealth.title}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 font-medium">
              <span>Chapters:</span>
              <span className="text-slate-300 font-semibold">{conceptHealth.tabs.join(" · ")}</span>
            </div>
          </div>
          <div className="flex bg-[#07080d] p-1 border border-[#1b1c2b] rounded-lg">
            {conceptHealth.tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#121126] border border-[#3d3d91]/50 text-[#8584ff]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Active Chapter Details */}
        <div className="mb-5 flex justify-between items-center bg-[#07080d]/50 p-4 border border-[#1b1c2b]/50 rounded-xl">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{currentChapter.name}</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{currentChapter.conceptCount} concepts inside</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter Proficiency</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-extrabold ${currentChapter.overallScore < 50 ? "text-red-400" : currentChapter.overallScore < 75 ? "text-yellow-400" : "text-emerald-400"}`}>
                {currentChapter.overallScore}%
              </span>
              <div className="w-16 bg-[#121126] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${currentChapter.overallScore < 50 ? "bg-red-400" : currentChapter.overallScore < 75 ? "bg-yellow-400" : "bg-emerald-400"}`}
                  style={{ width: `${currentChapter.overallScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Concept Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentChapter.concepts.map((concept) => {
            const isWeak = concept.tag === "WEAK";
            const isStrong = concept.tag === "STRONG";
            return (
              <div
                key={concept.name}
                onClick={() => handleConceptClick(concept)}
                className={`p-4 border rounded-xl bg-[#080911]/50 hover:bg-[#101021]/30 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between h-[105px] group ${
                  isWeak
                    ? "border-red-950/40 hover:border-red-900/60 shadow-[0_0_15px_rgba(239,68,68,0.03)]"
                    : isStrong
                    ? "border-emerald-950/40 hover:border-emerald-900/60"
                    : "border-[#1b1c2b] hover:border-[#3d3d91]/50"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold text-slate-200 tracking-wide group-hover:text-white transition-colors truncate">
                    {concept.name}
                  </span>
                  {isWeak && (
                    <span className="text-[8px] font-extrabold text-red-400 border border-red-500/20 bg-red-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex-none">
                      Weak
                    </span>
                  )}
                  {isStrong && (
                    <span className="text-[8px] font-extrabold text-emerald-400 border border-emerald-500/20 bg-emerald-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider flex-none">
                      Strong
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {concept.attempts} attempts
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-extrabold ${concept.score < 50 ? "text-red-400" : concept.score < 75 ? "text-yellow-400" : "text-emerald-400"}`}>
                      {concept.score}%
                    </span>
                    <div className="w-12 bg-[#121126] h-1 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${concept.score < 50 ? "bg-red-400" : concept.score < 75 ? "bg-yellow-400" : "bg-emerald-400"}`}
                        style={{ width: `${concept.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
