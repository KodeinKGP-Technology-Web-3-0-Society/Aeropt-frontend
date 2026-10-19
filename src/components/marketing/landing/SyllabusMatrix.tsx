"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface SyllabusUnit {
  name: string;
  weightage: string;
  topicCount: number;
  highlight: string;
  chapters: string[];
}

interface SubjectData {
  name: string;
  color: string;
  badgeClass: string;
  borderClass: string;
  totalTopics: number;
  description: string;
  units: SyllabusUnit[];
}

const SYLLABUS_DATA: Record<string, SubjectData> = {
  Physics: {
    name: "Physics",
    color: "text-physics",
    badgeClass: "bg-physics/10 text-physics border-physics/20",
    borderClass: "border-physics/30",
    totalTopics: 368,
    description: "From classical Newtonian mechanics and field theory to quantum transitions and semiconductor physics.",
    units: [
      {
        name: "Mechanics",
        weightage: "~32% JEE Weightage",
        topicCount: 118,
        highlight: "Core foundation for JEE Advanced multi-concept problems",
        chapters: [
          "Units & Dimensions",
          "Kinematics 1D & 2D",
          "Newton's Laws of Motion",
          "Work, Energy & Power",
          "Center of Mass & Collisions",
          "Rotational Dynamics",
          "Gravitation",
          "Fluid Mechanics",
          "Simple Harmonic Motion",
        ],
      },
      {
        name: "Electrodynamics & Optics",
        weightage: "~36% JEE Weightage",
        topicCount: 134,
        highlight: "High-yield analytical derivations and vector integrals",
        chapters: [
          "Electrostatics & Gauss's Law",
          "Capacitance & Dielectrics",
          "Current Electricity & Circuits",
          "Magnetic Effects of Current",
          "Electromagnetic Induction",
          "Alternating Current & LC Circuits",
          "Wave Optics & Interference",
          "Ray Optics & Optical Instruments",
        ],
      },
      {
        name: "Thermodynamics & Modern Physics",
        weightage: "~32% JEE Weightage",
        topicCount: 116,
        highlight: "Scoring, formula-dense concepts with high predictability",
        chapters: [
          "Thermal Properties of Matter",
          "Thermodynamics & Heat Engines",
          "Kinetic Theory of Gases",
          "Dual Nature of Radiation & Matter",
          "Atomic Structure & Bohr Model",
          "Nuclear Physics & Radioactivity",
          "Semiconductors & Logic Gates",
        ],
      },
    ],
  },
  Chemistry: {
    name: "Chemistry",
    color: "text-chemistry",
    badgeClass: "bg-chemistry/10 text-chemistry border-chemistry/20",
    borderClass: "border-chemistry/30",
    totalTopics: 342,
    description: "Thorough balance between thermodynamic calculations, periodic trends, and reaction mechanisms.",
    units: [
      {
        name: "Physical Chemistry",
        weightage: "~34% JEE Weightage",
        topicCount: 122,
        highlight: "Quantitative problem-solving and equilibrium graphs",
        chapters: [
          "Mole Concept & Stoichiometry",
          "Atomic Structure & Quantum Numbers",
          "States of Matter & Gas Laws",
          "Chemical Thermodynamics",
          "Chemical & Ionic Equilibrium",
          "Redox Reactions & Electrochemistry",
          "Chemical Kinetics & Rate Laws",
          "Solutions & Colligative Properties",
        ],
      },
      {
        name: "Organic Chemistry",
        weightage: "~38% JEE Weightage",
        topicCount: 138,
        highlight: "Reaction mechanisms, stereochemistry, and multi-step synthesis",
        chapters: [
          "General Organic Chemistry (GOC)",
          "Hydrocarbons (Alkanes, Alkenes, Alkynes)",
          "Haloalkanes & Haloarenes",
          "Alcohols, Phenols & Ethers",
          "Aldehydes, Ketones & Carboxylic Acids",
          "Amines & Nitrogen Compounds",
          "Biomolecules & Polymers",
        ],
      },
      {
        name: "Inorganic Chemistry",
        weightage: "~28% JEE Weightage",
        topicCount: 82,
        highlight: "Coordination compounds, orbital hybridization, and NCERT facts",
        chapters: [
          "Periodic Classification & Periodicity",
          "Chemical Bonding & Molecular Geometry",
          "Coordination Compounds & Crystal Field",
          "p-Block, d-Block & f-Block Elements",
          "Qualitative Salt Analysis",
        ],
      },
    ],
  },
  Mathematics: {
    name: "Mathematics",
    color: "text-maths",
    badgeClass: "bg-maths/10 text-maths border-maths/20",
    borderClass: "border-maths/30",
    totalTopics: 306,
    description: "Rigorous proofs, algebraic manipulation, and coordinate transformation calibrated for speed and accuracy.",
    units: [
      {
        name: "Calculus",
        weightage: "~38% JEE Weightage",
        topicCount: 114,
        highlight: "Highest weighted math section in both Main & Advanced",
        chapters: [
          "Functions, Domain & Range",
          "Limits, Continuity & Differentiability",
          "Applications of Derivatives (Max/Min)",
          "Indefinite Integration & Substitution",
          "Definite Integrals & Properties",
          "Area Under Curves",
          "Differential Equations",
        ],
      },
      {
        name: "Algebra",
        weightage: "~32% JEE Weightage",
        topicCount: 106,
        highlight: "Algebraic foundations, roots, combinatorics, and matrices",
        chapters: [
          "Quadratic Equations & Expressions",
          "Complex Numbers & De Moivre's",
          "Sequences & Series (AP, GP, HP, AGP)",
          "Binomial Theorem & Expansions",
          "Permutations & Combinations",
          "Matrices & Determinants",
          "Probability & Statistics",
        ],
      },
      {
        name: "Coordinate Geometry & Vectors",
        weightage: "~30% JEE Weightage",
        topicCount: 86,
        highlight: "Standard equations, tangents, normals, and 3D space vectors",
        chapters: [
          "Straight Lines & Pairs of Lines",
          "Circles & Family of Circles",
          "Parabola, Ellipse & Hyperbola",
          "Vectors (Dot, Cross, Box Products)",
          "Three Dimensional Geometry (Lines & Planes)",
          "Trigonometric Ratios, Equations & Inverse",
        ],
      },
    ],
  },
};

export default function SyllabusMatrix() {
  const [selectedSubject, setSelectedSubject] = useState<string>("Physics");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string | null>("Rotational Dynamics");

  const subject = SYLLABUS_DATA[selectedSubject];

  // Filter chapters based on search query across current subject
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return subject.units;
    const q = searchQuery.toLowerCase().trim();
    return subject.units
      .map((u) => ({
        ...u,
        chapters: u.chapters.filter((ch) => ch.toLowerCase().includes(q)),
      }))
      .filter((u) => u.chapters.length > 0);
  }, [subject, searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return filteredUnits.reduce((acc, u) => acc + u.chapters.length, 0);
  }, [filteredUnits]);

  return (
    <section id="syllabus" className="scroll-mt-16 border-t border-line bg-surface px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        {/* Asymmetric Header Layout — NOT centered! */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-line/70">
          <div className="max-w-2xl">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              1,016 CONCEPTS · FULL JEE MAINS & ADVANCED DIRECTORY
            </span>
            <h2
              data-reveal
              className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl"
            >
              The Full JEE Syllabus Directory
            </h2>
            <p data-reveal className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">
              Structured exactly how top rankers study. Explore exam weightage, filter through all 1,016 topics, and select any chapter for instant Socratic problem solving.
            </p>
          </div>

          {/* Search Box in Header */}
          <div data-reveal className="w-full lg:max-w-md">
            <div className="relative flex items-center">
              <svg
                className="absolute left-4 h-4 w-4 text-muted pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                aria-label={`Search ${subject.name} chapters`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${subject.name} chapters (e.g. ${
                  subject.name === "Physics" ? "Rotational, Doppler, Gauss" : subject.name === "Chemistry" ? "Equilibrium, Aldol, Kinetics" : "Calculus, Parabola, Limits"
                })...`}
                className="w-full rounded-2xl border border-line bg-canvas pl-11 pr-24 py-3 text-xs sm:text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-surface focus:outline-hidden transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 rounded-lg bg-line/60 px-2 py-1 text-[11px] font-semibold text-ink-2 hover:bg-line"
                >
                  Clear
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-2 text-xs text-muted">
                Showing {totalFilteredCount} matching chapter{totalFilteredCount === 1 ? "" : "s"} in {subject.name}
              </p>
            )}
          </div>
        </div>

        {/* Subject Switcher Bar & Summary Telemetry */}
        <div data-reveal className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-canvas p-1.5 shadow-xs">
            {Object.keys(SYLLABUS_DATA).map((subjKey) => {
              const data = SYLLABUS_DATA[subjKey];
              const isSelected = selectedSubject === subjKey;
              return (
                <button
                  key={subjKey}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(subjKey);
                    setSelectedChapter(data.units[0].chapters[0]);
                  }}
                  className={`landing-btn flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                    isSelected
                      ? "bg-ink text-surface shadow-md"
                      : "text-ink-2 hover:bg-hover hover:text-ink"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${subjKey === "Physics" ? "bg-physics" : subjKey === "Chemistry" ? "bg-chemistry" : "bg-maths"}`} />
                  {data.name}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-mono ${isSelected ? "bg-surface/20 text-surface" : "bg-line/60 text-muted"}`}>
                    {data.totalTopics}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-ink-2 font-medium">
            <span className="font-bold text-ink">{subject.totalTopics} Concepts</span> · Full NCERT & JEE Advanced Coverage
          </div>
        </div>

        {/* Unit & Chapter Intelligence Cards */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3 items-start">
          {filteredUnits.length > 0 ? (
            filteredUnits.map((unit) => (
              <div
                key={unit.name}
                data-reveal
                className="flex flex-col justify-between rounded-3xl border border-line bg-canvas/70 p-6 shadow-xs hover:border-line-strong transition-all h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-surface px-2.5 py-1 text-[11px] font-bold text-ink border border-line shadow-2xs">
                      {unit.weightage}
                    </span>
                    <span className="text-xs font-mono font-semibold text-muted">
                      {unit.topicCount} topics
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-ink">
                    {unit.name}
                  </h3>
                  <p className="mt-1 text-xs text-ink-2 leading-relaxed">
                    {unit.highlight}
                  </p>

                  {/* Chapter Pills */}
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {unit.chapters.map((ch) => {
                      const isSelected = selectedChapter === ch;
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setSelectedChapter(ch)}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent text-accent-on font-bold shadow-xs"
                              : "border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-hover hover:text-ink"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-[11px] text-muted font-medium">
                  <span>{unit.chapters.length} core chapters</span>
                  <span className="text-accent font-semibold">100% Socratic Ready</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-line bg-canvas p-12 text-center">
              <p className="text-sm font-semibold text-ink">No chapters match &ldquo;{searchQuery}&rdquo; in {subject.name}</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-on"
              >
                Reset Search Filter
              </button>
            </div>
          )}
        </div>

        {/* Selected Chapter Inspector Bar */}
        {selectedChapter && (
          <div data-reveal className="mt-8 rounded-2xl border border-accent/40 bg-accent/[0.035] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-on text-base font-bold">
                ✓
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Selected Chapter for Socratic Study
                </span>
                <h4 className="font-display text-lg font-bold text-ink">
                  {selectedChapter}
                </h4>
                <p className="text-xs text-ink-2">
                  Prerequisites verified · Instant practice problems calibrated to JEE Mains & Advanced difficulty.
                </p>
              </div>
            </div>
            <Link
              href="/study"
              className="landing-btn inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-accent-on shadow-xs shrink-0 hover:bg-accent-hover"
            >
              Start {selectedChapter} Session →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
