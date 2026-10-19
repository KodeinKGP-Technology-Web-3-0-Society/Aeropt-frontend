import { NightDeskArt } from "./Illustrations";

const PAINS = [
  { title: "Nobody to ask", body: "The doubt shows up after the coaching class has ended.", tint: "var(--danger)" },
  { title: "Answers that skip steps", body: "A solution key shows the result, not why step three follows.", tint: "var(--warning)" },
  { title: "A chatbot that guesses", body: "Plausible, confident, and sometimes wrong about the physics.", tint: "var(--physics)" },
];

export default function ProblemBand() {
  return (
    <section className="relative overflow-hidden bg-canvas px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-reveal className="mx-auto w-full max-w-sm lg:max-w-md">
          <NightDeskArt className="h-auto w-full" />
        </div>
        <div>
          <h2 data-reveal className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
            Self-study is where most ranks are won. It is also where you get stuck alone.
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {PAINS.map((p) => (
              <li key={p.title} data-reveal className="landing-tile rounded-2xl p-5" style={{ ["--tile" as string]: p.tint }}>
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
