import React from "react";

/**
 * The JeePath mark: a "J" drawn as a road. The journey starts at the hook (bottom-left),
 * climbs the stem along its lane markings, and reaches a teal flag — the goal — planted on
 * the top bar, which doubles as the शिरोरेखा (the headline stroke of Devanagari script).
 *
 * Colours come from the theme tokens (ink, accent, canvas), so the mark follows light and
 * dark mode. `tile` draws the app-icon form: a paper road on an ink tile.
 */
export function JeePathMark({ size = 32, tile = false, title }: { size?: number; tile?: boolean; title?: string }) {
  const road = tile ? "var(--bg-main)" : "var(--text-main)";
  const lane = tile ? "var(--text-main)" : "var(--bg-main)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className="shrink-0"
    >
      {tile && <rect width="48" height="48" rx="11" fill="var(--text-main)" />}
      <g transform={tile ? "translate(4.2 5.2) scale(0.82)" : undefined}>
        {/* the road */}
        <path
          d="M31 11.5 V28.5 C31 37.5 25 42 18 42 C13.2 42 10 39.4 8.6 36"
          fill="none"
          stroke={road}
          strokeWidth="8.4"
        />
        <circle cx="8.6" cy="36" r="4.2" fill={road} />
        {/* lane markings */}
        <path
          d="M31 15 V28.5 C31 37.5 25 42 18 42 C13.2 42 10 39.4 8.6 36"
          fill="none"
          stroke={lane}
          strokeWidth="1.5"
          strokeDasharray="2.6 2.6"
          strokeLinecap="round"
        />
        {/* the top bar — J's crossbar and Devanagari shirorekha */}
        <path d="M15 11.5 H39" stroke={road} strokeWidth="3.6" strokeLinecap="round" />
        {/* the goal */}
        <path d="M34.6 11.5 V2.6" stroke={road} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M34.6 2.6 L43 5.1 L34.6 7.6 Z" fill="var(--accent)" />
      </g>
    </svg>
  );
}

/** Mark + "JeePath" wordmark ("Jee" in ink, "Path" in the accent). */
export default function JeePathLogo({
  size = 32,
  wordmark = true,
  textClassName = "text-xl",
  domain = false,
}: {
  size?: number;
  wordmark?: boolean;
  textClassName?: string;
  /** Show the ".ai" suffix (marketing surfaces only). */
  domain?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <JeePathMark size={size} title={wordmark ? undefined : "JeePath"} />
      {wordmark && (
        <span className={`font-display font-bold tracking-tight text-ink ${textClassName}`}>
          Jee<span className="text-accent">Path</span>
          {domain && <span className="ml-px text-[0.6em] font-medium text-muted">.ai</span>}
        </span>
      )}
    </span>
  );
}
