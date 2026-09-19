"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp } from "@/components/AppContext";
import { apiRequest, getApiBaseUrl } from "@/lib/auth";
import { CacheTTL, cacheKey, cachedGet } from "@/lib/apiCache";

type SortKey = "concept" | "chapter" | "score" | "attempts" | "accuracy" | "lastAttempted";
type SortOrder = "asc" | "desc";

const DEFAULT_CHART_COLORS = [
  "var(--physics)",
  "var(--maths)",
  "var(--danger)",
  "var(--chemistry)",
  "var(--success)",
];

function SortHeader({
  label,
  columnKey,
  sortKey,
  sortOrder,
  onSort,
  align = "left",
}: {
  label: string;
  columnKey: SortKey;
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = sortKey === columnKey;
  const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none";
  return (
    <th aria-sort={ariaSort} className={`py-3 px-4 ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        aria-label={`Sort by ${label}${isActive ? (sortOrder === "asc" ? ", ascending" : ", descending") : ""}`}
        className={`inline-flex items-center gap-1 cursor-pointer uppercase tracking-wider hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        <span aria-hidden="true">{isActive ? (sortOrder === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
}

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
    cachedGet(cacheKey(["progress"]), CacheTTL.progress, () =>
      apiRequest<typeof data.progress & { totalAttempts?: number }>(url)
    )
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
    // Same skeleton shape as DashboardContent/RoadmapContent: header, stat row,
    // table block. A bare "Loading…" line collapsed the layout and jumped.
    return (
      <div
        className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto animate-pulse"
        role="status"
        aria-busy="true"
        aria-label="Loading your progress"
      >
        <div className="h-7 w-40 rounded-lg bg-hover mb-2" />
        <div className="h-4 w-64 rounded bg-hover/60 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-line bg-surface" />
          ))}
        </div>
        <div className="h-64 rounded-2xl border border-line bg-surface" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto">
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button
          type="button"
          onClick={fetchProgress}
          className="text-xs font-semibold text-ink border border-line rounded-lg px-3 py-1.5"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 pb-6 pt-[6.75rem] lg:px-8 lg:pb-8 overflow-y-auto">
      <div className="mb-8 select-none">
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-ink">Progress</h1>
        <p className="text-xs text-muted font-medium mt-1">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="bg-surface border border-line rounded-xl p-5 shadow-lg relative overflow-hidden"
          >
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
              {stat.label}
            </span>
            <h2 className="text-3xl font-extrabold text-ink mt-2 mb-1">{stat.value}</h2>
            <p className="text-xs text-muted font-medium mt-0.5">{stat.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-lg lg:col-span-2 flex flex-col justify-between select-none">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest">
              Proficiency Over Time
            </h3>
            {proficiencyOverTime.chapters.length > 0 ? (
              <div className="flex flex-wrap gap-4 mt-2">
                {proficiencyOverTime.chapters.map((chapter, index) => (
                  <div
                    key={chapter.name}
                    className="flex items-center gap-1.5 text-[10px] text-ink-2 font-semibold"
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
              <p className="text-[10px] text-muted mt-2">
                Complete practice questions to see chapter trends.
              </p>
            )}
          </div>

          <div className="relative w-full h-[200px]">
            {proficiencyOverTime.chapters.length > 0 ? (
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full"
                role="img"
                aria-label={`Proficiency over the last ${proficiencyOverTime.dates.length} days for ${proficiencyOverTime.chapters
                  .map((c) => c.name)
                  .join(", ")}.`}
              >
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
              <div className="flex items-center justify-center h-full text-xs text-muted">
                No proficiency history yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4">
              Where your mistakes are coming from
            </h3>
            <div className="space-y-4">
              {mistakesDistribution.map((mistake) => {
                let barColor = "bg-accent";
                if (mistake.type === "Procedural") barColor = "bg-[#38bdf8]";
                if (mistake.type === "Calculation") barColor = "bg-[#eab308]";
                if (mistake.type === "Misinterpretation") barColor = "bg-[#f43f5e]";

                return (
                  <div key={mistake.type} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold select-none">
                      <span className="text-ink-2">{mistake.type}</span>
                      <span className="text-muted">
                        <strong className="text-ink font-bold">{mistake.count}</strong> ·{" "}
                        {mistake.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-hover h-2 rounded-full overflow-hidden border border-line">
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
          <div className="text-[10px] text-muted font-semibold mt-4 text-center select-none uppercase tracking-wider leading-relaxed">
            Data compiled from {totalAttempts} questions
          </div>
        </div>
      </div>

      <div className="bg-surface border border-line rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-4">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest select-none">
            Concept Breakdown
          </h3>
          <input
            type="text"
            placeholder="Search concepts or chapters..."
            aria-label="Search concepts or chapters"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-canvas border border-line focus:border-accent/80 text-xs text-ink placeholder-slate-600 rounded-lg px-3 py-1.5 outline-none transition-colors w-full sm:w-[220px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-line text-[10px] font-bold text-muted uppercase tracking-wider select-none">
                <SortHeader label="Concept" columnKey="concept" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="Chapter" columnKey="chapter" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader label="Score" columnKey="score" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                <SortHeader label="Attempts" columnKey="attempts" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                <SortHeader label="Accuracy" columnKey="accuracy" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} align="right" />
                <SortHeader label="Last Attempted" columnKey="lastAttempted" sortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
                <th className="py-3 px-4 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1c2b]/50 text-xs">
              {sortedRows.length > 0 ? (
                sortedRows.map((row) => (
                  <tr key={`${row.concept}-${row.chapter}`} className="hover:bg-hover transition-colors">
                    <td className="py-3.5 px-4 font-bold text-ink tracking-wide">{row.concept}</td>
                    <td className="py-3.5 px-4 text-muted font-semibold">{row.chapter}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-extrabold ${
                          row.score < 50 ? "text-red-400" : row.score < 75 ? "text-yellow-400" : "text-emerald-400"
                        }`}
                      >
                        {row.score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-muted font-semibold">
                      {row.attempts}
                    </td>
                    <td className="py-3.5 px-4 text-right text-ink-2 font-bold">
                      {row.accuracy}%
                    </td>
                    <td className="py-3.5 px-4 text-muted font-semibold">
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
                  <td colSpan={7} className="text-center py-6 text-muted">
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
