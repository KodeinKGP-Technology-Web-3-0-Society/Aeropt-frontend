"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import Lenis from "lenis";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import JeePathLogo from "@/components/JeePathLogo";
import { DoubtMock, LessonMock, PlanMock, PracticeMock, ProgressMock } from "./landing/Mockups";

/*
 * Landing page. Light-first paper and ink with one teal accent (.impeccable.md).
 * Depth comes from scroll: a 3D stage of real product screens in the hero, a
 * pinned carousel that turns to each part of the product, a perspective strip
 * of the tutor's own diagrams (compiled from TikZ, public/landing/*.svg) and a
 * ring of the 20 JEE Main units. Lenis smooths the page's own scroll container
 * (the app's <body> does not scroll). prefers-reduced-motion gets the same
 * content laid out flat, with no smoothing and no scroll-driven motion.
 */

const UNITS = [
  "Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Rotational Motion",
  "Gravitation", "Solids and Liquids", "Thermodynamics", "Kinetic Theory", "Oscillations and Waves",
  "Electrostatics", "Current Electricity", "Magnetism", "EMI and AC", "EM Waves",
  "Optics", "Dual Nature", "Atoms and Nuclei", "Electronic Devices", "Experimental Skills",
];

const DIAGRAMS = [
  { src: "/landing/projectile.svg", title: "Projectile motion", caption: "Range, height and the components that never change." },
  { src: "/landing/dipole.svg", title: "Electric dipole", caption: "Field lines leave + and end on −." },
  { src: "/landing/lens.svg", title: "Convex lens", caption: "Three rays, one image — the lens formula drawn." },
  { src: "/landing/orbit.svg", title: "Satellite orbit", caption: "Gravity supplies the centripetal force." },
  { src: "/landing/shm.svg", title: "Simple harmonic motion", caption: "Amplitude, period, phase — at a glance." },
  { src: "/landing/lc_circuit.svg", title: "LC oscillations", caption: "Energy sloshing between C and L." },
];

const STEPS = [
  {
    kicker: "Learn",
    title: "A lesson that waits for you.",
    body: "One idea at a time, grounded in your course material, with a check question after every part. Say “I know this” and it moves on — no gatekeeping.",
    mock: <LessonMock />,
  },
  {
    kicker: "Practise",
    title: "Real JEE questions, graded instantly.",
    body: "Official JEE Advanced questions with their official answers, plus NCERT and textbook practice. Pick an option or type a number and see right or wrong at once. Difficulty adjusts as you go.",
    mock: <PracticeMock />,
  },
  {
    kicker: "Ask",
    title: "Doubts answered — with diagrams.",
    body: "Stuck mid-question? Ask why. The tutor shows what it is doing as it works, draws the diagram, and never hands over the answer you were about to find.",
    mock: <DoubtMock />,
  },
  {
    kicker: "Track",
    title: "Every answer remembered.",
    body: "Streaks, accuracy, weak spots and a mistake notebook — and the tutor reads the same record, so the next lesson starts where you are.",
    mock: <ProgressMock />,
  },
];

/* ── smooth scroll ─────────────────────────────────────────────────────────── */

function useLenis(wrapper: RefObject<HTMLDivElement | null>, content: RefObject<HTMLDivElement | null>, enabled: boolean) {
  const lenisRef = useRef<Lenis | null>(null);
  useEffect(() => {
    if (!enabled || !wrapper.current || !content.current) return;
    const lenis = new Lenis({ wrapper: wrapper.current, content: content.current, lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let frame = 0;
    const raf = (t: number) => {
      lenis.raf(t);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [wrapper, content, enabled]);
  return lenisRef;
}

/* ── hero: 3D stage of product screens ─────────────────────────────────────── */


function Hero({ scroller, reduce }: { scroller: RefObject<HTMLDivElement | null>; reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  const textY = useTransform(p, [0, 1], [0, -120]);
  const textOpacity = useTransform(p, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden px-5 pb-24 pt-28 sm:px-8"
    >
      {/* contour field: the brand's "altitude" lines */}
      <div className="altitude-field" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <motion.div style={reduce ? undefined : { y: textY, opacity: textOpacity }}>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4rem]">
            Crack JEE Physics, one topic at a time.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Short lessons at your own pace. Real JEE Advanced questions with official answers, checked the moment you submit.
            Ask any doubt and get a worked explanation with a diagram. Your study plan updates itself as you go.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/auth?tab=signup" className="rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-ink-on shadow-[0_10px_30px_-12px_oklch(22%_0.03_250/0.6)] transition-transform hover:-translate-y-0.5 active:translate-y-0">
              Start free
            </Link>
            <Link href="/auth" className="rounded-xl border border-line bg-surface px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-hover">
              Log in
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">20 units · 239 syllabus topics · 342 official JEE Advanced questions</p>
        </motion.div>

        <div className="relative h-[460px] sm:h-[540px]">
          <div className="absolute left-0 top-0 w-[72%] max-sm:w-[86%] opacity-90">
            <ProgressMock />
          </div>
          <div className="absolute left-[12%] top-[12%] w-[76%] max-sm:left-[4%] max-sm:w-[92%]">
            <LessonMock />
          </div>
          <div className="absolute left-[34%] top-[30%] w-[64%] max-sm:left-[16%] max-sm:w-[80%]">
            <PracticeMock />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── pinned carousel: the product, one face at a time ──────────────────────── */

function Story({ scroller, reduce }: { scroller: RefObject<HTMLDivElement | null>; reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.5 });
  const [active, setActive] = useState(0);
  const [faceWidth, setFaceWidth] = useState(440);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length * 0.999)))));
  useEffect(() => {
    const fit = () => setFaceWidth(Math.min(440, Math.max(280, window.innerWidth - 48)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const rotateY = useTransform(p, [0, 1], [0, -90 * (STEPS.length - 1)]);
  const radius = faceWidth / 2;

  if (reduce) {
    return (
      <section id="how" className="px-5 py-24 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-16">
          {STEPS.map((s) => (
            <div key={s.kicker} className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-ink-2">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs tabular-nums text-ink">{STEPS.indexOf(s) + 1}</span>
                  {s.kicker}
                </p>
                <h3 className="mt-3 font-display text-3xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-3 text-ink-2">{s.body}</p>
              </div>
              {s.mock}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="how" ref={ref} style={{ height: `${STEPS.length * 100}svh` }} className="relative">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-5 sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative z-10">
            <ol className="mb-6 flex gap-2" aria-label="Steps">
              {STEPS.map((s, i) => (
                <li key={s.kicker} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-10 bg-accent" : "w-4 bg-line"}`}>
                  <span className="sr-only">{s.kicker}</span>
                </li>
              ))}
            </ol>
            <div className="relative min-h-[230px]">
              {STEPS.map((s, i) => (
                <div
                  key={s.kicker}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-6 opacity-0" : "translate-y-6 opacity-0"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-2">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs tabular-nums text-ink">{i + 1}</span>
                    {s.kicker}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.6rem]">{s.title}</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center" style={{ perspective: 1600 }}>
            <motion.div className="relative" style={{ width: faceWidth, height: 430, rotateY, rotateX: -4, transformStyle: "preserve-3d" }}>
              {STEPS.map((s, i) => (
                <div
                  key={s.kicker}
                  className="absolute inset-0"
                  style={{ transform: `rotateY(${i * 90}deg) translateZ(${radius}px)`, backfaceVisibility: "hidden" }}
                >
                  {s.mock}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── diagrams strip: horizontal, in perspective ────────────────────────────── */

function DiagramStrip({ scroller, reduce }: { scroller: RefObject<HTMLDivElement | null>; reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 24 });
  const x = useTransform(p, [0, 1], ["4%", "-58%"]);

  const card = (d: (typeof DIAGRAMS)[number], i: number) => (
    <figure key={d.src} className="group w-[min(360px,78vw)] shrink-0 rounded-3xl border border-line bg-surface p-6 transition-transform duration-500 hover:-translate-y-2"
      style={reduce ? undefined : { transform: `rotateY(${i % 2 ? -8 : 8}deg)` }}>
      <div className="flex h-48 items-center justify-center">
        <img src={d.src} alt={`${d.title} diagram`} loading="lazy" className="landing-art max-h-full w-auto max-w-full" />
      </div>
      <figcaption className="mt-5 border-t border-line pt-4">
        <p className="font-display text-lg font-semibold text-ink">{d.title}</p>
        <p className="mt-1 text-sm text-muted">{d.caption}</p>
      </figcaption>
    </figure>
  );

  const heading = (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
        When a picture explains it better, the tutor draws one.
      </h2>
      <p className="mt-4 max-w-xl text-ink-2">Real vector diagrams — circuits, ray diagrams, fields, graphs — typeset like a textbook, made on the spot for your question.</p>
    </div>
  );

  if (reduce) {
    return (
      <section className="py-24">
        {heading}
        <div className="mx-auto mt-10 grid max-w-6xl gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">{DIAGRAMS.map(card)}</div>
      </section>
    );
  }
  return (
    <section ref={ref} className="relative h-[260svh]">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        {heading}
        <div className="mt-12" style={{ perspective: 1400 }}>
          <motion.div className="flex gap-6 pl-[max(1.25rem,calc((100vw-72rem)/2+2rem))]" style={{ x }}>
            {DIAGRAMS.map(card)}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── syllabus ring ─────────────────────────────────────────────────────────── */

function SyllabusRing({ scroller, reduce }: { scroller: RefObject<HTMLDivElement | null>; reduce: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: ref, offset: ["start end", "end start"] });
  const rotateY = useSpring(useTransform(scrollYProgress, [0, 1], [40, -220]), { stiffness: 80, damping: 22 });
  const [radius, setRadius] = useState(420);
  useEffect(() => {
    const fit = () => setRadius(Math.min(440, Math.max(190, window.innerWidth * 0.36)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">
          Every unit of JEE Main Physics. Nothing you&apos;ll be tested on is missing.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-2">
          Mapped topic by topic to the NTA syllabus — 20 units, 239 topics, lab experiments included.
        </p>
      </div>
      {reduce ? (
        <ul className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-2">
          {UNITS.map((u) => (
            <li key={u} className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink-2">{u}</li>
          ))}
        </ul>
      ) : (
        <div className="relative mx-auto mt-16 h-[340px]" style={{ perspective: 1300 }} aria-label="The 20 JEE Main Physics units">
          <motion.div className="absolute left-1/2 top-1/2" style={{ rotateX: -14, rotateY, transformStyle: "preserve-3d" }}>
            {UNITS.map((u, i) => (
              <div
                key={u}
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-[0_10px_30px_-18px_oklch(22%_0.03_250/0.4)]"
                style={{ transform: `rotateY(${(i * 360) / UNITS.length}deg) translateZ(${radius}px)`, backfaceVisibility: "hidden" }}
              >
                <span className="mr-2 text-xs tabular-nums text-accent">{String(i + 1).padStart(2, "0")}</span>
                {u}
              </div>
            ))}
          </motion.div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="font-display text-6xl font-semibold tabular-nums text-ink">239</p>
            <p className="text-sm text-muted">syllabus topics</p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ── numbers, plan, close ──────────────────────────────────────────────────── */

function Reveal({ children, delay = 0, reduce }: { children: ReactNode; delay?: number; reduce: boolean }) {
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Numbers({ reduce }: { reduce: boolean }) {
  // Verified counts from the retrieval index (agent: make extract-status). Coaching test-paper
  // questions are not counted as past papers.
  const stats = [
    ["342", "official JEE Advanced questions", "with the official answer key"],
    ["28", "NCERT Physics chapters", "Class 11 and 12, every one"],
    ["239", "JEE Main syllabus topics", "every NTA unit covered"],
    ["4,000+", "questions with checked answers", "official keys and verified solutions"],
  ];
  return (
    <section className="px-5 py-20 sm:px-8">
      <Reveal reduce={reduce}>
        <dl className="mx-auto grid max-w-6xl border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([n, label, sub], i) => (
            <div key={label} className={`px-6 py-8 ${i ? "border-t border-line sm:border-t-0 lg:border-l" : ""} ${i === 2 ? "sm:border-t lg:border-t-0" : ""} ${i % 2 ? "sm:border-l" : ""}`}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <p className="font-display text-4xl font-semibold tabular-nums tracking-tight text-ink">{n}</p>
                <p className="mt-2 font-semibold text-ink">{label}</p>
                <p className="mt-1 text-sm text-muted">{sub}</p>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

function PlanBlock({ reduce }: { reduce: boolean }) {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal reduce={reduce}>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink sm:text-5xl">A plan to exam day that keeps itself honest.</h2>
          <p className="mt-4 max-w-lg text-ink-2">
            Tell it your exam and your hours. It schedules every topic and every review, tells you plainly if you&apos;re behind and
            what it would take to catch up — and moves forward on its own as you study.
          </p>
        </Reveal>
        <Reveal delay={0.1} reduce={reduce}>
          <PlanMock />
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta({ reduce }: { reduce: boolean }) {
  return (
    <section className="border-t border-line px-5 py-20 sm:px-8">
      <Reveal reduce={reduce}>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">Start your first lesson in two minutes.</h2>
            <p className="mt-2 text-ink-2">Pick a topic, or begin at the start of the syllabus.</p>
          </div>
          <Link href="/auth?tab=signup" className="shrink-0 rounded-xl bg-ink px-7 py-3.5 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90">
            Start free
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reduce = Boolean(useReducedMotion());
  const lenis = useLenis(scrollRef, contentRef, !reduce);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const bar = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setScrolled(v > 0.01));

  const goTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: -8 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div ref={scrollRef} className="h-dvh overflow-y-auto overflow-x-hidden bg-canvas text-ink">
      <div ref={contentRef}>
        <motion.div className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent" style={{ scaleX: bar }} aria-hidden />
        <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? "border-b border-line bg-surface/80 backdrop-blur-md" : "border-b border-transparent"}`}>
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center" aria-label="JeePath home">
              <JeePathLogo size={30} textClassName="text-lg" domain />
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2" aria-label="Main">
              <a href="#how" onClick={goTo("how")} className="hidden rounded-lg px-3 py-2 text-ink-2 hover:text-ink sm:block">How it works</a>
              <Link href="/auth" className="rounded-lg px-3 py-2 text-ink-2 hover:text-ink">Log in</Link>
              <Link href="/auth?tab=signup" className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-ink-on transition-colors hover:bg-ink/90">Start free</Link>
            </nav>
          </div>
        </header>

        <main>
          <Hero scroller={scrollRef} reduce={reduce} />
          <Story scroller={scrollRef} reduce={reduce} />
          <DiagramStrip scroller={scrollRef} reduce={reduce} />
          <SyllabusRing scroller={scrollRef} reduce={reduce} />
          <Numbers reduce={reduce} />
          <PlanBlock reduce={reduce} />
          <FinalCta reduce={reduce} />
        </main>

        <footer className="border-t border-line px-5 py-10 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
            <JeePathLogo size={22} textClassName="text-base" />
            <p>JEE Physics, one topic at a time.</p>
            <div className="flex gap-4">
              <Link href="/auth" className="hover:text-ink">Log in</Link>
              <Link href="/auth?tab=signup" className="hover:text-ink">Sign up</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
