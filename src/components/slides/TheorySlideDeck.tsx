"use client";

import React, { useEffect, useRef, useState } from "react";
import SlideShell from "@/components/slides/SlideShell";
import SlideBody from "@/components/slides/SlideBody";
import MathExpandModal from "@/components/slides/MathExpandModal";
import MarkdownMath from "@/components/MarkdownMath";
import type { SlidesPayload } from "@/components/slides/types";

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
    <>
      <SlideShell
        title={slide.title}
        subtitle={payload.mode === "example" ? "Worked example" : "Theory"}
        slideIndex={index}
        totalSlides={slides.length}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
        onExpand={() => setExpandContent(slide.body_md)}
        showExpand
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
    </>
  );
}
