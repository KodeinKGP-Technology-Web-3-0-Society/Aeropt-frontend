import type { ComponentType } from "react";
import { LessonMock, PlanMock, PracticeMock, ProgressMock } from "./Mockups";

const BENEFITS: { title: string; body: string; Mock: ComponentType; badge: string; badgeColor: string }[] = [
  {
    title: "Lessons that go at your pace",
    body: "One idea at a time, with a quick check after each part. Already know it? Say so and it moves ahead.",
    Mock: LessonMock,
    badge: "Learn",
    badgeColor: "text-accent",
  },
  {
    title: "Practice that tells you right away",
    body: "Pick an option or type a number. You see if it is right the moment you answer, and why if it is not.",
    Mock: PracticeMock,
    badge: "Practise",
    badgeColor: "text-success",
  },
  {
    title: "See where you are strong and weak",
    body: "Your accuracy, streak and weak topics in one place. The next lesson starts from there.",
    Mock: ProgressMock,
    badge: "Track",
    badgeColor: "text-warning",
  },
  {
    title: "A plan up to your exam date",
    body: "Tell it when your exam is. It lays out what to cover each day and adjusts when you fall behind.",
    Mock: PlanMock,
    badge: "Plan",
    badgeColor: "text-physics",
  },
];

export default function Benefits() {
  return (
    <section id="what-you-get" className="scroll-mt-16 border-t border-line bg-canvas px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 data-reveal className="max-w-xl font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
          Everything you need for an evening of study
        </h2>
        <div className="mt-14 flex flex-col gap-20 lg:gap-28">
          {BENEFITS.map(({ title, body, Mock, badge, badgeColor }, i) => (
            <div key={title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div data-reveal className={i % 2 === 1 ? "lg:order-2" : ""}>
                <span className={`inline-block text-xs font-bold uppercase tracking-widest ${badgeColor}`}>
                  {badge}
                </span>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[1.75rem]">{title}</h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-ink-2">{body}</p>
              </div>
              <div data-reveal className={`landing-mockup-wrapper ${i % 2 === 1 ? "lg:order-1" : ""}`}>
                <Mock />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
