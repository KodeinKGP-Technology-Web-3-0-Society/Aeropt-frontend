const QUESTIONS = [
  {
    q: "Which subjects and exams does it cover?",
    a: "Physics, Chemistry and Mathematics for JEE Main and Advanced, built on NCERT, H.C. Verma and official JEE Advanced papers. If a question falls outside what the course material covers, the tutor says so instead of guessing.",
  },
  {
    q: "How is this different from asking a general chatbot?",
    a: "JeePath looks up the course material before it teaches, computes the numbers instead of estimating them, and has a second pass review each answer. It also remembers what you got wrong and plans your revision.",
  },
  {
    q: "Can it be wrong?",
    a: "Yes. Checks reduce errors, they do not remove them. When the material does not match your question, or the topic is outside what it covers, it says so. If something looks off, ask it to explain the step.",
  },
  {
    q: "Does it just hand me the answer?",
    a: "Not when you are practising. It gives a hint first and asks what you would try, and shows the full solution when you ask for it or after you have tried.",
  },
  {
    q: "What does it cost?",
    a: "You can start for free. Sign up and your first lesson begins right after setup.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-line bg-canvas px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 data-reveal className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
          Questions students ask first
        </h2>
        <div className="landing-faq divide-y divide-line rounded-3xl border border-line bg-surface">
          {QUESTIONS.map(({ q, a }) => (
            <details key={q} className="group px-6 py-1">
              <summary className="flex min-h-14 items-center justify-between gap-4 py-3 text-left font-semibold text-ink">
                {q}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-muted transition-transform motion-reduce:transition-none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
