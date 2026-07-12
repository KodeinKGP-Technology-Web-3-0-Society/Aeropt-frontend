"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/components/AppContext";
import { apiRequest, getApiBaseUrl } from "@/lib/auth";

type SortKey = "concept" | "chapter" | "score" | "attempts" | "accuracy" | "lastAttempted";
type SortOrder = "asc" | "desc";

const DEFAULT_CHART_COLORS = ["#6258ff", "#eab308", "#ef4444", "#38bdf8", "#22c55e"];

export default function ProgressContent() {
  const { data, setData } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(() => {
    setLoading(true);
    setError(null);

    const url = `${getApiBaseUrl()}/analytics/progress/`;
    apiRequest<typeof data.progress & { totalAttempts?: number }>(url)
      .then((resData) => {
        const { totalAttempts: _totalAttempts, ...progress } = resData;
        setData((prev) => ({
          ...prev,
          progress,
        }));
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error("Progress fetch error:", err);
        setError(err.message || "Failed to load progress");
        setLoading(false);
      });
  }, [setData]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const { subtitle, stats, mistakesDistribution, proficiencyOverTime, conceptBreakdownTable } = data.progress;
  const totalAttempts = stats.find((stat) => stat.id === "questions_attempted")?.value ?? "0";

  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const datesCount = Math.max(proficiencyOverTime.dates.length, 1);
  const xStep = datesCount > 1 ? chartWidth / (datesCount - 1) : 0;

  const getSvgPoints = (values: number[]) => {
    if (values.length === 0) return "";
    if (values.length === 1) {
      const x = paddingLeft + chartWidth / 2;
      const y = paddingTop + chartHeight - (values[0] / 100) * chartHeight;
      return `${x},${y}`;
    }
    return values
      .map((val, idx) => {
        const x = paddingLeft + idx * xStep;
        const y = paddingTop + chartHeight - (val / 100) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredRows = conceptBreakdownTable.filter(
    (row) =>
      row.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.chapter.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        <p className="text-sm dark:text-slate-400 text-slate-500">Loading your progress…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchProgress}
          className="text-xs font-semibold dark:text-white text-slate-900 border dark:border-[#1b1c2b] border-slate-200 rounded-lg px-3 py-1.5"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
      <div className="mb-8 select-none">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight dark:text-white text-slate-900">Progress</h1>
        <p className="text-xs dark:text-slate-400 text-slate-500 font-medium mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-xl p-5 shadow-lg relative overflow-hidden"
          >
            <span className="text-[10px] font-bold dark:text-slate-500 text-slate-500 uppercase tracking-wider">
              {stat.label}
            </span>
            <h2 className="text-3xl font-extrabold dark:text-white text-slate-900 mt-2 mb-1">{stat.value}</h2>
            <p className="text-xs dark:text-slate-400 text-slate-500 font-medium mt-0.5">{stat.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-5 shadow-lg lg:col-span-2 flex flex-col justify-between select-none">
          <div className="mb-4">
            <h3 className="text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-widest">
              Proficiency Over Time
            </h3>
            {proficiencyOverTime.chapters.length > 0 ? (
              <div className="flex flex-wrap gap-4 mt-2">
                {proficiencyOverTime.chapters.map((chapter, index) => (
                  <div
                    key={chapter.name}
                    className="flex items-center gap-1.5 text-[10px] dark:text-slate-300 text-slate-700 font-semibold"
                  >
                    <span
                      className="h-1.5 w-4 rounded-full inline-block"
                      style={{
                        backgroundColor:
                          chapter.color || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length],
                      }}
                    />
                    {chapter.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] dark:text-slate-500 text-slate-500 mt-2">
                Complete practice questions to see chapter trends.
              </p>
            )}
          </div>

          <div className="relative w-full h-[200px]">
            {proficiencyOverTime.chapters.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {[0, 25, 50, 75, 100].map((grid) => {
                  const y = paddingTop + chartHeight - (grid / 100) * chartHeight;
                  return (
                    <g key={grid}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={width - paddingRight}
                        y2={y}
                        stroke="#1b1c2b"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3.5}
                        fill="#475569"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        {grid}%
                      </text>
                    </g>
                  );
                })}

                {proficiencyOverTime.dates.map((date, idx) => {
                  const x = paddingLeft + idx * xStep;
                  return (
                    <g key={`${date}-${idx}`}>
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartHeight}
                        stroke="#1b1c2b"
                        strokeWidth="1.2"
                      />
                      <text
                        x={x}
                        y={height - 5}
                        fill="#475569"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {date}
                      </text>
                    </g>
                  );
                })}

                {proficiencyOverTime.chapters.map((chapter, index) => (
                  <polyline
                    key={chapter.name}
                    fill="none"
                    stroke={chapter.color || DEFAULT_CHART_COLORS[index % DEFAULT_CHART_COLORS.length]}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getSvgPoints(chapter.data)}
                    className={index === 0 ? "drop-shadow-[0_0_4px_rgba(98,88,255,0.25)]" : undefined}
                  />
                ))}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-xs dark:text-slate-500 text-slate-500">
                No proficiency history yet
              </div>
            )}
          </div>
        </div>

        <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-widest mb-4">
              Where your mistakes are coming from
            </h3>
            <div className="space-y-4">
              {mistakesDistribution.map((mistake) => {
                let barColor = "bg-[#6258ff]";
                if (mistake.type === "Procedural") barColor = "bg-[#38bdf8]";
                if (mistake.type === "Calculation") barColor = "bg-[#eab308]";
                if (mistake.type === "Misinterpretation") barColor = "bg-[#f43f5e]";

                return (
                  <div key={mistake.type} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold select-none">
                      <span className="dark:text-slate-300 text-slate-700">{mistake.type}</span>
                      <span className="dark:text-slate-500 text-slate-500">
                        <strong className="dark:text-white text-slate-900 font-bold">{mistake.count}</strong> ·{" "}
                        {mistake.percentage}%
                      </span>
                    </div>
                    <div className="w-full dark:bg-[#111124] bg-slate-100 h-2 rounded-full overflow-hidden border dark:border-[#212239] border-slate-300">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${mistake.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[10px] dark:text-slate-500 text-slate-500 font-semibold mt-4 text-center select-none uppercase tracking-wider leading-relaxed">
            Data compiled from {totalAttempts} questions
          </div>
        </div>
      </div>

      <div className="dark:bg-[#0d0e16] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b dark:border-[#1b1c2b] border-slate-200 mb-4">
          <h3 className="text-xs font-bold dark:text-slate-400 text-slate-500 uppercase tracking-widest select-none">
            Concept Breakdown
          </h3>
          <input
            type="text"
            placeholder="Search concepts or chapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dark:bg-[#07080d] bg-white border dark:border-[#1b1c2b] border-slate-200 focus:border-[#6258ff]/80 text-xs dark:text-white text-slate-900 placeholder-slate-600 rounded-lg px-3 py-1.5 outline-none transition-colors w-full sm:w-[220px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b dark:border-[#1b1c2b] border-slate-200 text-[10px] font-bold dark:text-slate-500 text-slate-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort("concept")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors"
                >
                  Concept {sortKey === "concept" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("chapter")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors"
                >
                  Chapter {sortKey === "chapter" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("score")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors text-right"
                >
                  Score {sortKey === "score" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("attempts")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors text-right"
                >
                  Attempts {sortKey === "attempts" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("accuracy")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors text-right"
                >
                  Accuracy {sortKey === "accuracy" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th
                  onClick={() => handleSort("lastAttempted")}
                  className="py-3 px-4 cursor-pointer dark:hover:text-white text-slate-900 transition-colors"
                >
                  Last Attempted {sortKey === "lastAttempted" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1c2b]/50 text-xs">
              {sortedRows.length > 0 ? (
                sortedRows.map((row) => (
                  <tr key={`${row.concept}-${row.chapter}`} className="dark:hover:bg-[#101021] bg-slate-100/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold dark:text-white text-slate-900 tracking-wide">{row.concept}</td>
                    <td className="py-3.5 px-4 dark:text-slate-400 text-slate-500 font-semibold">{row.chapter}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-extrabold ${
                          row.score < 50 ? "text-red-400" : row.score < 75 ? "text-yellow-400" : "text-emerald-400"
                        }`}
                      >
                        {row.score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right dark:text-slate-400 text-slate-500 font-semibold">
                      {row.attempts}
                    </td>
                    <td className="py-3.5 px-4 text-right dark:text-slate-300 text-slate-700 font-bold">
                      {row.accuracy}%
                    </td>
                    <td className="py-3.5 px-4 dark:text-slate-400 text-slate-500 font-semibold">
                      {row.lastAttempted}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none">
                      {row.trend === "up" && (
                        <span className="text-emerald-400 font-bold border border-emerald-500/10 bg-emerald-950/20 px-1.5 py-0.5 rounded text-[10px]">
                          ▲ Up
                        </span>
                      )}
                      {row.trend === "down" && (
                        <span className="text-red-400 font-bold border border-red-500/10 bg-red-950/20 px-1.5 py-0.5 rounded text-[10px]">
                          ▼ Down
                        </span>
                      )}
                      {row.trend === "flat" && (
                        <span className="text-yellow-400 font-bold border border-yellow-500/10 bg-yellow-950/20 px-1.5 py-0.5 rounded text-[10px]">
                          ▬ Flat
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 dark:text-slate-500 text-slate-500">
                    {conceptBreakdownTable.length === 0
                      ? "Start studying to see your concept breakdown"
                      : "No matching concepts found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
