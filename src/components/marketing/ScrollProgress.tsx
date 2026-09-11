"use client";

import { useEffect, useRef } from "react";

/**
 * Thin accent hairline pinned to the top of the viewport, its width tracking
 * how far through the page the visitor has scrolled. Reads scroll position
 * on `scrollRef` (the landing page's own overflow-y-auto container, since
 * the app's <body> is overflow:hidden and doesn't scroll itself).
 *
 * Updated via rAF-throttled scroll listener, mutating the bar's transform
 * directly rather than a React state update per scroll event — this runs on
 * every scroll tick, so it has to stay off the render path entirely.
 */
export default function ScrollProgress({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
      bar.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <div className="scroll-progress-track" aria-hidden="true">
      <div ref={barRef} className="scroll-progress-bar" />
    </div>
  );
}
