"use client";

import { useEffect, useRef, useState } from "react";
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
  { key: "learn", label: "Learn a topic" },
  { key: "practice", label: "Practise questions" },
] as const;

export default function TopicSearch({ initialMode }: { initialMode: "learn" | "practice" }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"learn" | "practice">(initialMode);

  const go = (value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/study/${encodeURIComponent(trimmed)}${mode === "practice" ? "?mode=practice" : ""}`);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5  sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-fit rounded-xl bg-hover p-1" role="radiogroup" aria-label="How do you want to study?">
          {MODES.map((item) => (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={mode === item.key}
              onClick={() => setMode(item.key)}
              className={`min-h-11 cursor-pointer rounded-lg px-4 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                mode === item.key ? "bg-surface text-ink " : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            go(topic);
          }}
        >
          <label htmlFor="study-topic-input" className="sr-only">
            Topic to search
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-input px-3 transition-colors duration-150 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              id="study-topic-input"
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={mode === "practice" ? "Practise any topic" : "Study any topic"}
              aria-label="Topic to study or practise"
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
            <span className="hidden text-[13px] text-muted sm:inline">/</span>
            <button
              type="submit"
              disabled={!topic.trim()}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-on transition-colors duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Open
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => go(suggestion)}
              className="min-h-11 cursor-pointer rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 transition-colors duration-150 hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
