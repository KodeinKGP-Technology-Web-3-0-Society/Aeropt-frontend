/* eslint-disable @next/next/no-img-element */
/**
 * Product mockups for the landing page — real screens of the app rebuilt in
 * HTML (crisper than screenshots, theme-aware), showing what it actually does.
 * Purely presentational: no data, no handlers.
 */
import type { ReactNode } from "react";

export function Frame({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_-30px_oklch(22%_0.03_250/0.35)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong/60" />
        <span className="ml-2 truncate text-[11px] font-medium text-muted">{title}</span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function LessonMock() {
  return (
    <Frame title="Study room · Chemistry · Equilibrium">
      <div className="flex gap-4">
        <ol className="hidden w-36 shrink-0 flex-col gap-2 text-[11px] sm:flex">
          {[
            ["Dynamic equilibrium", "done"],
            ["Le Chatelier's principle", "now"],
            ["Equilibrium constant", "next"],
          ].map(([t, s], i) => (
            <li key={t} className="flex items-start gap-2">
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                s === "done" ? "bg-success/15 text-success" : s === "now" ? "bg-accent text-accent-on" : "border border-line text-muted"}`}>
                {s === "done" ? "✓" : i + 1}
              </span>
              <span className={s === "now" ? "font-semibold text-ink" : "text-muted"}>{t}</span>
            </li>
          ))}
        </ol>
        <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-ink-2">
          <p className="font-display text-sm font-semibold text-ink">Le Chatelier&apos;s principle</p>
          <p className="mt-1.5">Push a reaction at equilibrium and it shifts to undo the push. Add a reactant and it makes more product.</p>
          <p className="my-3 rounded-lg border border-line px-3 py-2 text-center font-mono text-[13px] text-ink">N₂ + 3H₂ ⇌ 2NH₃</p>
          <p className="rounded-lg bg-accent-soft px-3 py-2 font-medium text-ink">You add more N₂. Which way does it shift?</p>
        </div>
      </div>
    </Frame>
  );
}

export function PracticeMock() {
  // a = F/m = 10/2 = 5 m/s². Second option.
  const options = ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"];
  return (
    <Frame title="Practice · Physics · Laws of Motion">
      <p className="text-[12px] font-medium text-muted">Question 4 of 10</p>
      <p className="mt-1.5 text-[13px] text-ink">A 10 N force pulls a 2 kg block across a smooth floor. What is its acceleration?</p>
      <div className="mt-3 flex flex-col gap-1.5">
        {options.map((o, i) => {
          const correct = i === 1;
          return (
            <div key={o} className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-[12px] ${correct ? "border-success bg-success/10 text-ink" : "border-line text-ink-2"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${correct ? "bg-success text-surface" : "border border-line"}`}>
                {correct ? "✓" : i + 1}
              </span>
              {o}
            </div>
          );
        })}
      </div>
      <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-[12px] font-semibold text-success">Correct. Graded as soon as you answer.</p>
    </Frame>
  );
}

export function DoubtMock() {
  return (
    <Frame title="Ask a doubt">
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2 text-[12px] text-ink-on">Why does the horizontal velocity stay constant?</p>
      </div>
      <div className="mt-3 rounded-xl border border-line px-3.5 py-2.5 text-[11px]">
        <p className="flex items-center gap-2 font-medium text-ink">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" /> Drawing a diagram…
        </p>
        <ul className="mt-1.5 space-y-1 text-ink-2">
          <li><span className="text-success">✓</span> Reading your course material</li>
          <li><span className="text-success">✓</span> Recalling what you&apos;ve done before</li>
        </ul>
      </div>
      <img src="/landing/projectile.svg" alt="Projectile trajectory with velocity components" className="landing-art mt-3 h-28 w-auto" />
      <p className="mt-2 text-[12px] leading-relaxed text-ink-2">
        No horizontal force acts, so <span className="font-semibold text-ink">uₓ never changes</span> — gravity only bends the vertical part.
      </p>
    </Frame>
  );
}

export function ProgressMock() {
  const bars = [3, 5, 2, 6, 8, 4, 9, 7, 10, 6, 12, 9];
  return (
    <Frame title="Progress">
      <div className="grid grid-cols-3 gap-2">
        {[["Streak", "12 days"], ["This week", "84% right"], ["Mastered", "37 topics"]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line px-2.5 py-2">
            <p className="text-[10px] text-muted">{k}</p>
            <p className="text-[13px] font-semibold tabular-nums text-ink">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-20 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span key={i} className="flex-1 rounded-t-[3px] bg-accent" style={{ height: `${(h / 12) * 100}%`, opacity: 0.45 + (i / bars.length) * 0.55 }} />
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {[["Electrostatics", 0.82], ["Rotational Motion", 0.64], ["Optics", 0.41]].map(([u, p]) => (
          <div key={u as string}>
            <div className="flex justify-between text-[10px] text-ink-2"><span>{u}</span><span className="tabular-nums">{Math.round((p as number) * 100)}%</span></div>
            <div className="mt-0.5 h-1.5 rounded-full bg-hover"><div className="h-full rounded-full bg-accent" style={{ width: `${(p as number) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function PlanMock() {
  const days = [
    ["Mon", ["Review · Torque", "Learn · Rolling"]],
    ["Tue", ["Continue · Rolling", "Learn · Gravitation"]],
    ["Wed", ["Learn · Kepler's laws"]],
  ] as const;
  return (
    <Frame title="Plan · JEE Main 2027">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold tabular-nums text-ink">112 <span className="text-sm font-normal text-muted">days left</span></p>
        <span className="rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold text-success">On track</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {days.map(([d, items]) => (
          <div key={d} className="rounded-lg border border-line p-2">
            <p className="text-[11px] font-semibold text-ink">{d}</p>
            {items.map((it) => (
              <p key={it} className="mt-1 text-[10px] leading-snug text-ink-2">{it}</p>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
}
