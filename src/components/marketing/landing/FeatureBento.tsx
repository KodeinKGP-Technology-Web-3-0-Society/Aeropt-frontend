"use client";

import type { ComponentType, PointerEvent, SVGProps } from "react";
import { CheckArt, DiagramArt, GroundedArt, MemoryArt, PracticeArt, RoadmapArt } from "./Illustrations";

type Feature = {
  title: string;
  body: string;
  tint: string;
  Art: ComponentType<SVGProps<SVGSVGElement>>;
  span?: string;
};

const FEATURES: Feature[] = [
  {
    title: "Answers from your actual syllabus",
    body: "The tutor looks up NCERT, H.C. Verma and official JEE papers first, so the notation and depth match the exam you are sitting.",
    tint: "var(--accent)",
    Art: GroundedArt,
    span: "lg:col-span-2",
  },
  {
    title: "Diagrams, drawn for the problem",
    body: "Free-body, ray and circuit diagrams appear in the reply, labelled the way the text names them.",
    tint: "var(--physics)",
    Art: DiagramArt,
  },
  {
    title: "Checked before you see it",
    body: "Arithmetic is computed, units are checked, and a second pass reviews the answer.",
    tint: "var(--success)",
    Art: CheckArt,
  },
  {
    title: "Real JEE questions, graded instantly",
    body: "Practise on official papers for the topic you just learned. Options and numbers are marked straight away.",
    tint: "var(--chemistry)",
    Art: PracticeArt,
  },
  {
    title: "It remembers, so you do not forget",
    body: "Mistakes and shaky topics come back for review at the right moment.",
    tint: "var(--warning)",
    Art: MemoryArt,
  },
  {
    title: "A plan that runs to exam day",
    body: "Daily chapters set from your exam date, so you always know what to study today.",
    tint: "var(--accent)",
    Art: RoadmapArt,
    span: "lg:col-span-2",
  },
];

function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export default function FeatureBento() {
  return (
    <section id="what-you-get" className="scroll-mt-16 bg-surface px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 data-reveal className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl">
            Everything a good tutor does, on call.
          </h2>
          <p data-reveal className="mt-4 text-lg leading-relaxed text-ink-2">
            Explain, draw, check, quiz, remember, plan. One place, in the order you actually need them.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, body, tint, Art, span }) => (
            <article
              key={title}
              data-reveal
              onPointerMove={spotlight}
              className={`landing-tile flex flex-col rounded-3xl p-6 ${span ?? ""}`}
              style={{ ["--tile" as string]: tint }}
            >
              <Art className="mx-auto h-36 w-full max-w-[16rem]" />
              <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
