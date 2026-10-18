"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Projectile motion",
  "Chemical equilibrium",
  "Definite integrals",
  "LC oscillations",
  "Mole concept",
  "Matrices & Determinants",
];

const MODES = [
  { key: "learn", label: "Learn a topic", hint: "A short lesson, worked examples, then questions." },
  { key: "practice", label: "Practise questions", hint: "Straight to questions, no theory." },
] as const;

export default function TopicSearch({ initialMode }: { initialMode: "learn" | "practice" }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"learn" | "practice">(initialMode);

  const go = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/study/${encodeURIComponent(trimmed)}${mode === "practice" ? "?mode=practice" : ""}`);
    }
  };

  return (
    <section aria-label="Find any topic" className="rounded-xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-3.5">
        {/* Mode selector */}
        <div className="flex gap-6 border-b border-line pb-2.5" role="radiogroup" aria-label="How do you want to study?">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={mode === m.key}
              onClick={() => setMode(m.key)}
              className={`cursor-pointer pb-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                mode === m.key ? "border-b-2 border-accent text-ink font-semibold" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Search input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(topic);
          }}
          className="w-full"
        >
          <label htmlFor="study-topic-input" className="sr-only">
            Topic to search
          </label>
          <div className="relative flex items-center">
            <input
              id="study-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                mode === "practice"
                  ? "Practise questions on any topic (e.g. projectile motion, chemical kinetics, matrices)..."
                  : "Study any JEE topic (e.g. LC oscillations, chemical thermodynamics, definite integrals)..."
              }
              aria-label="Topic to study or practise"
              className="h-12 sm:h-13 w-full rounded-xl border border-line bg-input pl-4 pr-14 text-sm sm:text-base text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              disabled={!topic.trim()}
              aria-label="Open study room"
              className="absolute right-1.5 flex h-9 sm:h-10 w-9 sm:w-10 cursor-pointer items-center justify-center rounded-lg bg-accent text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="sr-only">Open study room</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-xs sm:text-sm">
            <span className="text-muted">Or pick:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => go(s)}
                className="cursor-pointer text-ink-2 underline decoration-line underline-offset-2 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
