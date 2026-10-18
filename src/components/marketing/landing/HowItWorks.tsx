const STEPS = [
  {
    n: "1",
    title: "Pick a chapter",
    body: "Or let JeePath choose the one that matters most for you right now.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
        <path d="M4 5h12M4 10h8M4 15h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "2",
    title: "Learn, then practise",
    body: "A short lesson, a few questions, and help the moment you get stuck.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
        <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "3",
    title: "Come back tomorrow",
    body: "It remembers what you did and picks up exactly where you left off.",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={1.5}>
        <path d="M4 4v5h5M16 16v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 9a7 7 0 0112.6-4.2M16 11a7 7 0 01-12.6 4.2" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className="border-t border-line bg-canvas px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 data-reveal className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
          How a session works
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s) => (
            <li key={s.n} data-reveal className="group relative border-t-2 border-ink pt-5">
              {/* Connecting line between steps (desktop only) */}
              {s.n !== "3" && (
                <span className="absolute right-0 top-[-1px] hidden h-0.5 w-8 bg-line md:block" aria-hidden="true" />
              )}
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-on">
                  {s.icon}
                </span>
                <p className="font-display text-sm font-semibold text-accent">Step {s.n}</p>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
