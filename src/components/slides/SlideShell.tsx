"use client";

import React from "react";

export function SlideDots({
  total,
  current,
  onSelect,
}: {
  total: number;
  current: number;
  /** When provided, dots become clickable jump targets. */
  onSelect?: (index: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5" role={onSelect ? "tablist" : undefined}>
      {Array.from({ length: total }, (_, i) => {
        const dotClass = `h-1.5 rounded-full transition-all ${
          i === current ? "w-5 bg-accent" : i < current ? "w-1.5 bg-accent/50" : "w-1.5 bg-slate-600/40"
        }`;
        if (!onSelect) return <span key={i} className={dotClass} />;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to slide ${i + 1} of ${total}`}
            onClick={() => onSelect(i)}
            className={`${dotClass} cursor-pointer hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
          />
        );
      })}
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
  onJump,
  onExpand,
  showExpand,
  children,
  footer,
  bodyRef,
  onTouchStart,
  onTouchEnd,
  animationKey,
}: {
  title: string;
  subtitle?: string;
  slideIndex: number;
  totalSlides: number;
  onPrev?: () => void;
  onNext?: () => void;
  /** Jump directly to a slide by index (wired to clickable progress dots). */
  onJump?: (index: number) => void;
  onExpand?: () => void;
  showExpand?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bodyRef?: React.Ref<HTMLDivElement>;
  onTouchStart?: React.TouchEventHandler<HTMLDivElement>;
  onTouchEnd?: React.TouchEventHandler<HTMLDivElement>;
  /** Changing this key re-triggers the slide-content enter animation. */
  animationKey?: string | number;
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
          <SlideDots total={totalSlides} current={slideIndex} onSelect={onJump} />
        </div>
      </div>
      <div
        ref={bodyRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="px-4 py-4 min-h-[140px] max-h-[320px] overflow-y-auto slide-body-scroll"
      >
        <div key={animationKey} className="slide-fade-in">
          {children}
        </div>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={slideIndex === 0}
          onClick={onPrev}
          title="Previous slide (←)"
          className="text-xs font-bold uppercase tracking-wider text-muted hover:text-accent disabled:opacity-30"
        >
          ← Prev
        </button>
        {footer}
        <button
          type="button"
          disabled={slideIndex >= totalSlides - 1}
          onClick={onNext}
          title="Next slide (→)"
          className="text-xs font-bold uppercase tracking-wider text-accent hover:text-white disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
