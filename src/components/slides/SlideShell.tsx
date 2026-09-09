"use client";

import React from "react";

export function SlideDots({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? "w-5 bg-accent" : i < current ? "w-1.5 bg-accent/50" : "w-1.5 bg-slate-600/40"
          }`}
        />
      ))}
    </div>
  );
}

export default function SlideShell({
  title,
  subtitle,
  slideIndex,
  totalSlides,
  onPrev,
  onNext,
  onExpand,
  showExpand,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  slideIndex: number;
  totalSlides: number;
  onPrev?: () => void;
  onNext?: () => void;
  onExpand?: () => void;
  showExpand?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft overflow-hidden">
      <div className="px-4 pt-4 pb-2 border-b border-line/80 border-line">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Slide {slideIndex + 1} of {totalSlides}
            </p>
            <h3 className="text-sm font-bold text-ink mt-0.5">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {showExpand && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-white shrink-0"
            >
              Expand
            </button>
          )}
        </div>
        <div className="mt-3">
          <SlideDots total={totalSlides} current={slideIndex} />
        </div>
      </div>
      <div className="px-4 py-4 min-h-[140px] max-h-[320px] overflow-y-auto slide-body-scroll">{children}</div>
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={slideIndex === 0}
          onClick={onPrev}
          className="text-xs font-bold uppercase tracking-wider text-muted hover:text-accent disabled:opacity-30"
        >
          ← Prev
        </button>
        {footer}
        <button
          type="button"
          disabled={slideIndex >= totalSlides - 1}
          onClick={onNext}
          className="text-xs font-bold uppercase tracking-wider text-accent hover:text-white disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
