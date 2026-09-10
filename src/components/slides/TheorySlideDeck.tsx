"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import SlideShell from "@/components/slides/SlideShell";
import SlideBody from "@/components/slides/SlideBody";
import MathExpandModal from "@/components/slides/MathExpandModal";
import MarkdownMath from "@/components/MarkdownMath";
import type { SlidesPayload } from "@/components/slides/types";

/** Minimum horizontal drag (px) before a touch gesture counts as a swipe. */
const SWIPE_THRESHOLD_PX = 40;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

function readStoredSlideIndex(storageKey: string | undefined, fallback: number, max: number): number {
  if (!storageKey || typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw == null) return fallback;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(0, parsed), Math.max(0, max - 1));
  } catch {
    return fallback;
  }
}

export default function TheorySlideDeck({
  payload,
  fallbackMarkdown,
  onComplete,
  onSlideChange,
  storageKey,
}: {
  payload: SlidesPayload;
  fallbackMarkdown?: string;
  onComplete?: () => void;
  onSlideChange?: (index: number, total: number) => void;
  storageKey?: string;
}) {
  const slides = payload.slides;
  const initialIndex = payload.current_index ?? 0;
  const [index, setIndex] = useState(() =>
    readStoredSlideIndex(storageKey, initialIndex, slides.length),
  );
  const [showFullText, setShowFullText] = useState(false);
  const [expandContent, setExpandContent] = useState<string | null>(null);

  const onSlideChangeRef = useRef(onSlideChange);
  const onCompleteRef = useRef(onComplete);
  onSlideChangeRef.current = onSlideChange;
  onCompleteRef.current = onComplete;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(slides.length - 1, i + 1)),
    [slides.length],
  );

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    localStorage.setItem(storageKey, String(index));
  }, [index, storageKey]);

  useEffect(() => {
    onSlideChangeRef.current?.(index, slides.length);
    if (index >= slides.length - 1 && slides.length > 0) {
      onCompleteRef.current?.();
    }
  }, [index, slides.length]);

  // Keyboard nav is scoped to this deck (tabIndex + onKeyDown below), not a
  // window-level listener — a chat transcript can have several slide decks
  // mounted at once, and only the one the student is actually focused on
  // should react to arrow keys.
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === "Escape") {
        if (expandContent) {
          event.stopPropagation();
          setExpandContent(null);
        }
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    },
    [expandContent, goPrev, goNext],
  );

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const t = event.touches[0];
    touchStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
  };

  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const end = event.changedTouches[0];
    if (!end) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    // Ignore mostly-vertical drags so scrolling a tall slide still works.
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  if (!slides.length) {
    if (fallbackMarkdown) {
      return (
        <div className="assistant-plain">
          <MarkdownMath content={fallbackMarkdown} />
        </div>
      );
    }
    return null;
  }

  if (showFullText && fallbackMarkdown) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowFullText(false)}
          className="text-xs font-bold uppercase tracking-wider text-accent"
        >
          ← Back to slides
        </button>
        <MarkdownMath content={fallbackMarkdown} />
      </div>
    );
  }

  const slide = slides[index];
  const isLast = index >= slides.length - 1;

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="slide-deck-focus-root outline-none"
      aria-roledescription="carousel"
      aria-label={`${slide.title} — slide ${index + 1} of ${slides.length}`}
    >
      <SlideShell
        title={slide.title}
        subtitle={payload.mode === "example" ? "Worked example" : "Theory"}
        slideIndex={index}
        totalSlides={slides.length}
        onPrev={goPrev}
        onNext={goNext}
        onJump={setIndex}
        onExpand={() => setExpandContent(slide.body_md)}
        showExpand
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        animationKey={slide.id}
        footer={
          <div className="flex items-center gap-3">
            {fallbackMarkdown && (
              <button
                type="button"
                onClick={() => setShowFullText(true)}
                className="text-[10px] font-bold uppercase tracking-wider text-muted hover:text-accent"
              >
                Detailed notes
              </button>
            )}
            {isLast && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Complete
              </span>
            )}
          </div>
        }
      >
        <SlideBody type={slide.type} bodyMd={slide.body_md} imageUrl={slide.image_url} />
      </SlideShell>
      {expandContent && (
        <MathExpandModal
          title={slide.title}
          content={expandContent}
          onClose={() => setExpandContent(null)}
        />
      )}
    </div>
  );
}
