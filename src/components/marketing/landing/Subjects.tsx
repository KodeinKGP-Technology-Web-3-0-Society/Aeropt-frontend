const SUBJECTS = [
  {
    name: "Physics",
    tone: "text-physics",
    border: "border-physics/30",
    bg: "bg-physics/5",
    chapters: [
      "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion", "Gravitation",
      "Thermodynamics", "Oscillations and Waves", "Electrostatics", "Current Electricity", "Magnetism",
      "Electromagnetic Induction", "Optics", "Modern Physics",
    ],
  },
  {
    name: "Chemistry",
    tone: "text-chemistry",
    border: "border-chemistry/30",
    bg: "bg-chemistry/5",
    chapters: [
      "Mole Concept", "Atomic Structure", "Chemical Bonding", "Thermodynamics", "Equilibrium",
      "Redox and Electrochemistry", "Chemical Kinetics", "Solutions", "Coordination Compounds",
      "General Organic Chemistry", "Hydrocarbons", "Alcohols, Phenols and Ethers", "Amines",
    ],
  },
  {
    name: "Mathematics",
    tone: "text-maths",
    border: "border-maths/30",
    bg: "bg-maths/5",
    chapters: [
      "Sets, Relations and Functions", "Complex Numbers", "Quadratic Equations", "Matrices and Determinants",
      "Permutations and Combinations", "Binomial Theorem", "Sequences and Series", "Limits and Continuity",
      "Differentiation", "Integration", "Differential Equations", "Coordinate Geometry", "Vectors and 3D",
    ],
  },
];

export default function Subjects() {
  return (
    <section id="subjects" className="scroll-mt-16 border-t border-line px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 data-reveal className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
          The full JEE syllabus, all three subjects
        </h2>
        <p data-reveal className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">
          Class 11 and 12, the way NCERT and your coaching teach it. Start at any chapter.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {SUBJECTS.map((s) => (
            <div
              key={s.name}
              data-reveal
              className={`group rounded-2xl border bg-surface p-6 transition-shadow duration-300 hover:shadow-[0_16px_48px_-12px_oklch(22%_0.03_250/0.15)] sm:p-8 ${s.border}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${s.bg} ${s.tone}`}
                >
                  {s.name[0]}
                </span>
                <h3 className={`font-display text-xl font-semibold ${s.tone}`}>{s.name}</h3>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {s.chapters.map((c) => (
                  <li
                    key={c}
                    className="rounded-full border border-line px-3 py-1.5 text-sm text-ink transition-colors group-hover:border-line-strong"
                  >
                    {c}
                  </li>
                ))}
                <li className="px-1 py-1.5 text-sm text-muted">and more</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
