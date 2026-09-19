"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

type SubjectId = "physics" | "chemistry" | "maths";
type Band = "strong" | "building" | "weak" | "unseen";
type NodeKind = "hub" | "chapter" | "concept";

type GraphNode = {
  id: string;
  label: string;
  kind: NodeKind;
  band: Band;
  parentId: string | null;
};

const SUBJECTS: { id: SubjectId; label: string; accent: string }[] = [
  { id: "physics", label: "Physics", accent: "var(--physics)" },
  { id: "chemistry", label: "Chemistry", accent: "var(--chemistry)" },
  { id: "maths", label: "Maths", accent: "var(--maths)" },
];

const BAND_FILL: Record<Band, string> = {
  strong: "var(--success)",
  building: "var(--warning)",
  weak: "var(--danger)",
  unseen: "transparent",
};

const BAND_STROKE: Record<Band, string> = {
  strong: "var(--success)",
  building: "var(--warning)",
  weak: "var(--danger)",
  unseen: "var(--border-button)",
};

const BAND_COPY: Record<Band, string> = {
  strong: "Strong — you know this",
  building: "Building — mixed results",
  weak: "Weak — needs practice",
  unseen: "Unseen — not attempted",
};

const BAND_RANK: Record<Band, number> = {
  weak: 0,
  building: 1,
  strong: 2,
  unseen: 3,
};

/** Dummy syllabus webs until live concept-health is wired. */
const DUMMY_WEBS: Record<SubjectId, GraphNode[]> = {
  physics: [
    { id: "p", label: "Physics", kind: "hub", band: "building", parentId: null },
    { id: "p-kin", label: "Kinematics", kind: "chapter", band: "weak", parentId: "p" },
    { id: "p-lom", label: "Laws of Motion", kind: "chapter", band: "building", parentId: "p" },
    { id: "p-wep", label: "Work & E", kind: "chapter", band: "strong", parentId: "p" },
    { id: "p-rot", label: "Rotation", kind: "chapter", band: "unseen", parentId: "p" },
    { id: "p-em", label: "Electrostat.", kind: "chapter", band: "weak", parentId: "p" },
    { id: "p-kin-1", label: "1D motion", kind: "concept", band: "building", parentId: "p-kin" },
    { id: "p-kin-2", label: "Projectiles", kind: "concept", band: "weak", parentId: "p-kin" },
    { id: "p-kin-3", label: "Relative vel.", kind: "concept", band: "unseen", parentId: "p-kin" },
    { id: "p-lom-1", label: "N2L", kind: "concept", band: "building", parentId: "p-lom" },
    { id: "p-lom-2", label: "Friction", kind: "concept", band: "weak", parentId: "p-lom" },
    { id: "p-wep-1", label: "Power", kind: "concept", band: "strong", parentId: "p-wep" },
    { id: "p-wep-2", label: "Conservation", kind: "concept", band: "strong", parentId: "p-wep" },
    { id: "p-rot-1", label: "Torque", kind: "concept", band: "unseen", parentId: "p-rot" },
    { id: "p-em-1", label: "Coulomb", kind: "concept", band: "weak", parentId: "p-em" },
    { id: "p-em-2", label: "Gauss", kind: "concept", band: "unseen", parentId: "p-em" },
  ],
  chemistry: [
    { id: "c", label: "Chemistry", kind: "hub", band: "unseen", parentId: null },
    { id: "c-atom", label: "Atomic struct.", kind: "chapter", band: "building", parentId: "c" },
    { id: "c-bond", label: "Bonding", kind: "chapter", band: "weak", parentId: "c" },
    { id: "c-eq", label: "Equilibrium", kind: "chapter", band: "unseen", parentId: "c" },
    { id: "c-org", label: "Hydrocarbons", kind: "chapter", band: "strong", parentId: "c" },
    { id: "c-kin", label: "Kinetics", kind: "chapter", band: "building", parentId: "c" },
    { id: "c-atom-1", label: "Orbitals", kind: "concept", band: "building", parentId: "c-atom" },
    { id: "c-bond-1", label: "VSEPR", kind: "concept", band: "weak", parentId: "c-bond" },
    { id: "c-bond-2", label: "Hybridisation", kind: "concept", band: "unseen", parentId: "c-bond" },
    { id: "c-eq-1", label: "Le Chatelier", kind: "concept", band: "unseen", parentId: "c-eq" },
    { id: "c-org-1", label: "Alkanes", kind: "concept", band: "strong", parentId: "c-org" },
    { id: "c-kin-1", label: "Order", kind: "concept", band: "building", parentId: "c-kin" },
  ],
  maths: [
    { id: "m", label: "Maths", kind: "hub", band: "strong", parentId: null },
    { id: "m-quad", label: "Quadratics", kind: "chapter", band: "strong", parentId: "m" },
    { id: "m-trig", label: "Trigonometry", kind: "chapter", band: "building", parentId: "m" },
    { id: "m-calc", label: "Differentiation", kind: "chapter", band: "weak", parentId: "m" },
    { id: "m-int", label: "Integration", kind: "chapter", band: "unseen", parentId: "m" },
    { id: "m-prob", label: "Probability", kind: "chapter", band: "building", parentId: "m" },
    { id: "m-quad-1", label: "Roots", kind: "concept", band: "strong", parentId: "m-quad" },
    { id: "m-trig-1", label: "Identities", kind: "concept", band: "building", parentId: "m-trig" },
    { id: "m-calc-1", label: "Chain rule", kind: "concept", band: "weak", parentId: "m-calc" },
    { id: "m-calc-2", label: "Maxima", kind: "concept", band: "unseen", parentId: "m-calc" },
    { id: "m-int-1", label: "Definite", kind: "concept", band: "unseen", parentId: "m-int" },
    { id: "m-prob-1", label: "Bayes", kind: "concept", band: "building", parentId: "m-prob" },
  ],
};

const W = 640;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const R_CHAPTER = 118;
const R_CONCEPT = 176;

function layout(nodes: GraphNode[]): Record<string, { x: number; y: number; r: number; a: number }> {
  const pos: Record<string, { x: number; y: number; r: number; a: number }> = {};
  const hub = nodes.find((n) => n.kind === "hub");
  if (hub) pos[hub.id] = { x: CX, y: CY, r: 28, a: 0 };

  const chapters = nodes.filter((n) => n.kind === "chapter");
  chapters.forEach((ch, i) => {
    const a = -Math.PI / 2 + (i / chapters.length) * Math.PI * 2;
    pos[ch.id] = { x: CX + Math.cos(a) * R_CHAPTER, y: CY + Math.sin(a) * R_CHAPTER, r: 12, a };
  });

  chapters.forEach((ch) => {
    const kids = nodes.filter((n) => n.parentId === ch.id);
    const base = pos[ch.id]?.a ?? 0;
    kids.forEach((k, j) => {
      const spread = kids.length === 1 ? 0 : (j - (kids.length - 1) / 2) * 0.38;
      const a = base + spread;
      pos[k.id] = { x: CX + Math.cos(a) * R_CONCEPT, y: CY + Math.sin(a) * R_CONCEPT, r: 7, a };
    });
  });
  return pos;
}

function labelAnchor(a: number): { anchor: "start" | "middle" | "end"; dx: number; dy: number } {
  const c = Math.cos(a);
  const s = Math.sin(a);
  if (Math.abs(c) < 0.35) return { anchor: "middle", dx: 0, dy: s > 0 ? 12 : -6 };
  return { anchor: c > 0 ? "start" : "end", dx: c > 0 ? 8 : -8, dy: 4 };
}

function activateKey(event: KeyboardEvent, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

type Props = {
  onOpenConcept: (name: string, weak: boolean) => void;
};

export default function DashboardHeatmap({ onOpenConcept }: Props) {
  const [subjectId, setSubjectId] = useState<SubjectId>("physics");
  const [focusChapter, setFocusChapter] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [view, setView] = useState<"web" | "weakest">("web");

  const subject = SUBJECTS.find((s) => s.id === subjectId) ?? SUBJECTS[0];
  const nodes = DUMMY_WEBS[subjectId];
  const positions = useMemo(() => layout(nodes), [nodes]);
  const hover = nodes.find((n) => n.id === hoverId) ?? null;
  const focused = nodes.find((n) => n.id === focusChapter) ?? null;

  const weakest = useMemo(() => {
    return nodes
      .filter((n) => n.kind === "concept" && n.band !== "unseen")
      .map((n) => {
        const chapter = nodes.find((c) => c.id === n.parentId);
        return { concept: n, chapterLabel: chapter?.label ?? "Chapter" };
      })
      .sort((a, b) => BAND_RANK[a.concept.band] - BAND_RANK[b.concept.band] || a.concept.label.localeCompare(b.concept.label))
      .slice(0, 8);
  }, [nodes]);

  const trail = (() => {
    if (hover?.kind === "concept") {
      const ch = nodes.find((n) => n.id === hover.parentId);
      return `${subject.label} → ${ch?.label ?? "Chapter"} → ${hover.label}`;
    }
    if (hover?.kind === "chapter") return `${subject.label} → ${hover.label}`;
    if (focused) return `${subject.label} → ${focused.label} · pick a topic`;
    return `${subject.label} · activate a chapter, then a topic`;
  })();

  return (
    <section className="flex h-full min-h-[28rem] min-w-0 flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Concept web
            </h2>
            <span className="rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
              Sample data
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-2 max-w-sm leading-relaxed">
            Centre is the subject. Inner ring is chapters. Outer ring is topics. Colour is mastery.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {SUBJECTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSubjectId(s.id);
                setFocusChapter(null);
              }}
              aria-pressed={subjectId === s.id}
              className={`min-h-11 px-3 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                subjectId === s.id
                  ? "text-accent-on"
                  : "text-muted border border-line hover:border-accent/40"
              }`}
              style={subjectId === s.id ? { background: s.accent } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={() => setView("web")}
          className={`min-h-9 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${
            view === "web"
              ? "bg-accent/20 text-accent border border-accent/40"
              : "border border-line text-muted"
          }`}
        >
          Web map
        </button>
        <button
          type="button"
          onClick={() => setView("weakest")}
          className={`min-h-9 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider cursor-pointer ${
            view === "weakest"
              ? "border border-danger/30 bg-danger/10 text-danger"
              : "border border-line text-muted"
          }`}
        >
          Weakest topics
        </button>
      </div>

      {view === "weakest" ? (
        weakest.length === 0 ? (
          <p className="text-sm text-muted">No measured weak topics in this sample yet.</p>
        ) : (
          <ol className="space-y-1 flex-1 overflow-y-auto">
            {weakest.map((row, i) => (
              <li key={row.concept.id}>
                <button
                  type="button"
                  onClick={() => onOpenConcept(row.concept.label, row.concept.band === "weak")}
                  className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-hover"
                >
                  <span className="w-5 text-xs tabular-nums text-muted">{i + 1}</span>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background: BAND_FILL[row.concept.band] === "transparent" ? "transparent" : BAND_FILL[row.concept.band],
                      border: `1.5px solid ${BAND_STROKE[row.concept.band]}`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {row.concept.label}
                    </span>
                    <span className="block text-xs text-muted">
                      {row.chapterLabel} · {BAND_COPY[row.concept.band]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: subject.accent }} />
              Subject
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              Chapter
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Topic
            </span>
            <span className="text-ink-2">·</span>
            {(
              [
                ["strong", "Strong"],
                ["building", "Building"],
                ["weak", "Weak"],
                ["unseen", "Unseen"],
              ] as const
            ).map(([band, label]) => (
              <span key={band} className="inline-flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: BAND_FILL[band] === "transparent" ? "transparent" : BAND_FILL[band],
                    border: `1.5px ${band === "unseen" ? "dashed" : "solid"} ${BAND_STROKE[band]}`,
                  }}
                />
                {label}
              </span>
            ))}
          </div>

          <div className="relative min-h-[22rem] flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="group" aria-label={`${subject.label} concept web`}>
              <circle cx={CX} cy={CY} r={R_CHAPTER} fill="none" stroke="currentColor" className="text-muted/25 text-ink/10" strokeDasharray="3 5" />
              <circle cx={CX} cy={CY} r={R_CONCEPT} fill="none" stroke="currentColor" className="text-muted/20 text-ink/10" strokeDasharray="2 6" />

              {nodes
                .filter((n) => n.parentId)
                .map((n) => {
                  const from = positions[n.parentId!];
                  const to = positions[n.id];
                  if (!from || !to) return null;
                  const onFocus =
                    !focusChapter ||
                    n.id === focusChapter ||
                    n.parentId === focusChapter ||
                    nodes.find((x) => x.id === n.parentId)?.parentId === focusChapter;
                  return (
                    <line
                      key={`e-${n.id}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={n.kind === "chapter" ? subject.accent : BAND_STROKE[n.band]}
                      strokeOpacity={onFocus ? (n.kind === "chapter" ? 0.45 : 0.55) : 0.08}
                      strokeWidth={n.kind === "chapter" ? 1.8 : 1.2}
                    />
                  );
                })}

              {nodes.map((n) => {
                const p = positions[n.id];
                if (!p) return null;
                const dashed = n.band === "unseen";
                const isFocusChapter = n.kind === "chapter" && focusChapter === n.id;
                const dim =
                  Boolean(focusChapter) &&
                  n.kind !== "hub" &&
                  n.id !== focusChapter &&
                  n.parentId !== focusChapter;
                const showConceptLabel =
                  n.kind === "concept" && (focusChapter === n.parentId || hoverId === n.id);
                const interactive = n.kind === "chapter" || n.kind === "concept";

                const onActivate = () => {
                  if (n.kind === "chapter") {
                    setFocusChapter((cur) => (cur === n.id ? null : n.id));
                    return;
                  }
                  if (n.kind === "concept") onOpenConcept(n.label, n.band === "weak");
                };

                return (
                  <g
                    key={n.id}
                    transform={`translate(${p.x} ${p.y})`}
                    opacity={dim ? 0.22 : 1}
                    className={interactive ? "cursor-pointer" : undefined}
                    role={interactive ? "button" : undefined}
                    tabIndex={interactive ? 0 : undefined}
                    aria-label={
                      n.kind === "chapter"
                        ? `${n.label} chapter, ${BAND_COPY[n.band]}`
                        : n.kind === "concept"
                          ? `${n.label}, ${BAND_COPY[n.band]}`
                          : undefined
                    }
                    aria-pressed={n.kind === "chapter" ? isFocusChapter : undefined}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onFocus={() => setHoverId(n.id)}
                    onBlur={() => setHoverId(null)}
                    onClick={interactive ? onActivate : undefined}
                    onKeyDown={interactive ? (e) => activateKey(e, onActivate) : undefined}
                  >
                    <circle
                      r={p.r + (hoverId === n.id || isFocusChapter ? 2 : 0)}
                      fill={n.kind === "hub" ? subject.accent : BAND_FILL[n.band]}
                      fillOpacity={n.kind === "hub" ? 1 : dashed ? 0 : 0.95}
                      stroke={n.kind === "hub" ? "var(--border-button)" : BAND_STROKE[n.band]}
                      strokeWidth={dashed ? 1.6 : isFocusChapter ? 2.4 : 1.4}
                      strokeDasharray={dashed ? "2.6 2.2" : undefined}
                    />
                    {n.kind === "hub" ? (
                      <text y={4} textAnchor="middle" fill="#fff" style={{ fontSize: 10, fontWeight: 700 }}>
                        {n.label}
                      </text>
                    ) : null}
                    {n.kind === "chapter" ? (
                      <text
                        x={Math.cos(p.a) * 20}
                        y={Math.sin(p.a) * 20 + 3}
                        textAnchor={labelAnchor(p.a).anchor}
                        className="fill-ink"
                        style={{ fontSize: 10, fontWeight: 600 }}
                      >
                        {n.label}
                      </text>
                    ) : null}
                    {showConceptLabel ? (
                      <text
                        x={Math.cos(p.a) * 14}
                        y={Math.sin(p.a) * 14 + 3}
                        textAnchor={labelAnchor(p.a).anchor}
                        className="fill-ink-2"
                        style={{ fontSize: 8, fontWeight: 600 }}
                      >
                        {n.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <p className="pointer-events-none absolute bottom-1 left-1 right-1 truncate text-xs text-ink-2" aria-live="polite">
              {hover ? `${trail} · ${BAND_COPY[hover.band]}` : trail}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
