const STATS = [
  { value: "1,016", label: "Topics covered" },
  { value: "3", label: "JEE subjects" },
  { value: "NCERT", label: "Verified content" },
  { value: "Free", label: "To start" },
];

export default function SocialProof() {
  return (
    <section
      data-reveal
      className="border-y border-line bg-canvas px-5 py-6 sm:px-8"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-0 gap-y-4">
        {STATS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            {i > 0 && (
              <span className="mx-6 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            )}
            <div className="flex items-baseline gap-2 px-3 text-center sm:text-left">
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                {s.value}
              </span>
              <span className="text-sm text-ink-2">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
