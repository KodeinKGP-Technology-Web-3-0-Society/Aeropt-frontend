"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useApp } from "@/components/AppContext";
import PrepwiseLogo from "@/components/PrepwiseLogo";
import MarkdownMath from "@/components/MarkdownMath";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Daily Classroom",
    desc: "A curated daily block. No guessing what to study next. Your agent plans a mix of new concepts and vital revisions.",
  },
  {
    title: "Concept Tracker",
    desc: "Visualize your exact mastery level. As you complete lessons and quizzes, your learning map updates dynamically.",
  },
  {
    title: "Doubt Solver",
    desc: "Stuck on a complex derivation? Our Doubt Agent clarifies your questions and hands you off to a specialized Solver Agent for step-by-step math breakdowns.",
  }
];

export default function LandingPage() {
  const { appTheme, setAppTheme } = useApp();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-white selection:text-black">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
        <div className="flex items-center gap-3">
          <PrepwiseLogo size={28} />
          <span className="font-semibold tracking-tight">Prepwise</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="#features" className="hidden text-zinc-400 hover:text-zinc-50 sm:block">Features</Link>
          <Link href="#demo" className="hidden text-zinc-400 hover:text-zinc-50 sm:block">Demo</Link>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block"></div>
          <Link href="/auth" className="text-zinc-400 hover:text-zinc-50">Log in</Link>
          <Link
            href="/auth?tab=signup"
            className="flex h-9 items-center justify-center rounded-md bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="relative px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
              Master JEE with your <br className="hidden sm:block" />
              dedicated AI Tutor.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Adaptive daily study plans, real-time Socratic lessons, and on-demand doubt solving—all powered by a swarm of specialized AI agents that track your mastery score.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/auth?tab=signup"
                className="flex h-12 items-center justify-center rounded-md bg-zinc-50 px-8 text-base font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Start your AI Classroom
              </Link>
              <Link href="/auth" className="text-sm font-semibold leading-6 text-zinc-50 hover:text-zinc-300">
                View study plan <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features Grid ───────────────────────────────────────────────── */}
        <section id="features" className="border-t border-zinc-800 px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Engineered for mastery.</h2>
              <p className="mt-4 text-lg text-zinc-400">The core tools and surfaces powering your preparation.</p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800">
                    <CheckIcon />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Demo / Interactive UI ───────────────────────────────────────── */}
        <section id="demo" className="border-t border-zinc-800 px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-6xl grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Experience Active Learning.</h2>
              <p className="mt-4 text-lg leading-relaxed text-zinc-400">
                Our Socratic Tutor Agent doesn't just hand you the answer. It asks guiding questions, grounds its logic in the syllabus, and forces you to think. 
              </p>
              <ul className="mt-8 space-y-4 text-sm text-zinc-400">
                <li className="flex items-start gap-3">
                  <CheckIcon /> No hallucinations: Built strictly on JEE syllabus data.
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon /> Handoff mechanism: Complex maths? The Doubt Agent hands you to the Solver Agent.
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-4">
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
                <div className="h-3 w-3 rounded-full bg-zinc-700"></div>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-end">
                  <div className="rounded-lg bg-zinc-800 px-4 py-3 text-zinc-50 max-w-[85%]">
                    Can you explain projectile motion range?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-300 max-w-[95%]">
                    <p className="mb-2">Split the motion into two independent parts — horizontal at constant velocity, vertical under gravity. The range works out to:</p>
                    <MarkdownMath content={"$$R = \\dfrac{v^2\\sin(2\\theta)}{g}$$"} className="text-zinc-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 text-zinc-50">
            <PrepwiseLogo size={20} />
            <span className="font-semibold tracking-tight text-sm">Prepwise</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Prepwise. Minimalist, professional AI learning.
          </p>
        </div>
      </footer>
    </div>
  );
}
