"use client";

import { useEffect, useRef, useState } from "react";

/** One "usual way / Aeropt" row, wiped in left-to-right the first time it enters view. */
export default function CompareRow({
  usual,
  aeropt,
  delay = 0,
}: {
  usual: string;
  aeropt: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    // Two nested elements on purpose: this outer one is what's observed, and
    // it never gets a clip-path — an observed element whose own box is
    // clipped to zero width (its hidden state) can end up reporting a
    // permanent 0 intersection ratio, since the clip shrinks the very box
    // being measured. The clip-path lives on the inner element instead.
    <div ref={ref}>
      <div
        className={`compare-row${visible ? " is-visible" : ""} grid grid-cols-1 items-start gap-2 border-t border-line py-5 sm:grid-cols-[1fr_1.3fr] sm:gap-8`}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        <p className="text-[15px] text-muted line-through decoration-1">{usual}</p>
        <p className="text-[15px] font-medium text-ink">{aeropt}</p>
      </div>
    </div>
  );
}
