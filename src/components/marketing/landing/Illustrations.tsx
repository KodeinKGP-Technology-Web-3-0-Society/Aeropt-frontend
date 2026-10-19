/**
 * Landing illustrations. Hand-drawn SVG, no raster files: every colour is a theme
 * variable, so each one is correct in light and dark without a second asset.
 */
import type { SVGProps } from "react";

const INK = "var(--text-main)";
const MUTED = "var(--text-muted)";
const LINE = "var(--border-main)";
const SURFACE = "var(--bg-surface)";
const PHYS = "var(--physics)";
const CHEM = "var(--chemistry)";
const ACC = "var(--accent)";
const WARN = "var(--warning)";
const OK = "var(--success)";
const DANGER = "var(--danger)";

type P = SVGProps<SVGSVGElement>;

/** Hero backdrop: layered hills, the road up to the flag, and the three things a student does. */
export function HeroScene(props: P) {
  return (
    <svg viewBox="0 0 560 460" fill="none" aria-hidden="true" {...props}>
      <path d="M0 330 C 90 270 170 300 250 262 C 340 220 430 270 560 214 V460 H0Z" fill={ACC} opacity="0.1" />
      <path d="M0 380 C 110 330 200 372 300 330 C 400 288 470 330 560 296 V460 H0Z" fill={PHYS} opacity="0.12" />
      <path d="M0 424 C 120 392 230 424 330 396 C 430 368 500 396 560 380 V460 H0Z" fill={CHEM} opacity="0.14" />
      {/* the road */}
      <path d="M70 430 C 150 400 120 340 210 318 S 330 300 350 240 S 410 130 452 96" stroke={INK} strokeWidth="14" strokeLinecap="round" opacity="0.88" />
      <path className="landing-dash" d="M70 430 C 150 400 120 340 210 318 S 330 300 350 240 S 410 130 452 96" stroke={SURFACE} strokeWidth="2.5" strokeLinecap="round" />
      {/* flag */}
      <path d="M452 96 V38" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M452 40 L508 56 L452 76Z" fill={ACC} />
      {/* milestones */}
      <circle cx="210" cy="318" r="9" fill={SURFACE} stroke={PHYS} strokeWidth="4" />
      <circle cx="350" cy="240" r="9" fill={SURFACE} stroke={CHEM} strokeWidth="4" />
      <circle cx="418" cy="148" r="9" fill={SURFACE} stroke={WARN} strokeWidth="4" />
      {/* floating badges */}
      <g className="landing-float">
        <circle cx="120" cy="180" r="30" fill={SURFACE} stroke={PHYS} strokeWidth="2.5" />
        <ellipse cx="120" cy="180" rx="17" ry="7" stroke={PHYS} strokeWidth="2" />
        <ellipse cx="120" cy="180" rx="17" ry="7" stroke={PHYS} strokeWidth="2" transform="rotate(60 120 180)" />
        <ellipse cx="120" cy="180" rx="17" ry="7" stroke={PHYS} strokeWidth="2" transform="rotate(120 120 180)" />
        <circle cx="120" cy="180" r="3.5" fill={PHYS} />
      </g>
      <g className="landing-float-slow">
        <circle cx="500" cy="236" r="28" fill={SURFACE} stroke={CHEM} strokeWidth="2.5" />
        <path d="M493 222h14M496 222v12l-9 16a3 3 0 0 0 3 4.5h20a3 3 0 0 0 3-4.5l-9-16v-12" stroke={CHEM} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M489 247h22" stroke={CHEM} strokeWidth="2.2" />
      </g>
      <g className="landing-float">
        <circle cx="272" cy="96" r="26" fill={SURFACE} stroke={WARN} strokeWidth="2.5" />
        <circle cx="272" cy="96" r="14" stroke={WARN} strokeWidth="2.2" />
        <circle cx="272" cy="96" r="6" stroke={WARN} strokeWidth="2.2" />
        <circle cx="272" cy="96" r="1.8" fill={WARN} />
      </g>
    </svg>
  );
}

/** An open textbook with the cited line lit up. */
export function GroundedArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <path d="M120 40 C 90 28 56 30 30 38 V118 C 56 110 90 108 120 120Z" fill={SURFACE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M120 40 C 150 28 184 30 210 38 V118 C 184 110 150 108 120 120Z" fill={SURFACE} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {[52, 64, 76, 88].map((y) => (
        <path key={y} d={`M44 ${y} H104`} stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      ))}
      <rect x="40" y="70" width="68" height="12" rx="3" fill={ACC} opacity="0.2" />
      <path d="M44 76 H100" stroke={ACC} strokeWidth="3" strokeLinecap="round" />
      {[52, 64, 76].map((y) => (
        <path key={y} d={`M136 ${y} H196`} stroke={LINE} strokeWidth="3" strokeLinecap="round" />
      ))}
      <g className="landing-float">
        <rect x="128" y="94" width="88" height="26" rx="13" fill={SURFACE} stroke={ACC} strokeWidth="2" />
        <text x="172" y="111" textAnchor="middle" fontSize="11" fontWeight="600" fill={ACC} fontFamily="var(--font-plex-sans), sans-serif">NCERT XI · Ch 5</text>
      </g>
    </svg>
  );
}

/** A block on an incline with the forces the tutor would draw. */
export function DiagramArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <path d="M26 120 L196 120 L196 48Z" fill={PHYS} opacity="0.1" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <g transform="rotate(-23.5 120 84)">
        <rect x="92" y="62" width="44" height="30" rx="3" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
        <path d="M114 77 V30" stroke={PHYS} strokeWidth="3" strokeLinecap="round" />
        <path d="M108 38 L114 28 L120 38" stroke={PHYS} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M136 77 H178" stroke={WARN} strokeWidth="3" strokeLinecap="round" />
        <path d="M170 71 L180 77 L170 83" stroke={WARN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M114 100 V142" stroke={DANGER} strokeWidth="3" strokeLinecap="round" />
      <path d="M108 134 L114 144 L120 134" stroke={DANGER} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M170 120 A 26 26 0 0 0 164 104" stroke={MUTED} strokeWidth="2" />
      <text x="146" y="114" fontSize="12" fill={MUTED} fontFamily="var(--font-plex-mono), monospace">θ</text>
    </svg>
  );
}

/** A shield with a tick: nothing reaches you unchecked. */
export function CheckArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <path d="M120 22 L168 38 V74 C 168 100 148 118 120 130 C 92 118 72 100 72 74 V38Z" fill={OK} opacity="0.14" stroke={OK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M100 76 L114 90 L142 58" stroke={OK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <g className="landing-float-slow">
        <rect x="14" y="52" width="62" height="24" rx="12" fill={SURFACE} stroke={LINE} strokeWidth="2" />
        <text x="45" y="68" textAnchor="middle" fontSize="11" fill={INK} fontFamily="var(--font-plex-mono), monospace">v = √(2gh)</text>
      </g>
      <g className="landing-float">
        <rect x="166" y="84" width="62" height="24" rx="12" fill={SURFACE} stroke={LINE} strokeWidth="2" />
        <text x="197" y="100" textAnchor="middle" fontSize="11" fill={OK} fontFamily="var(--font-plex-mono), monospace">[L T⁻¹] ✓</text>
      </g>
    </svg>
  );
}

/** A question paper with one option chosen and graded. */
export function PracticeArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <rect x="50" y="14" width="140" height="124" rx="10" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
      <path d="M68 36 H172 M68 48 H146" stroke={LINE} strokeWidth="4" strokeLinecap="round" />
      {[
        { y: 66, on: false, l: "A" },
        { y: 86, on: true, l: "B" },
        { y: 106, on: false, l: "C" },
      ].map((o) => (
        <g key={o.l}>
          <rect x="66" y={o.y - 8} width="108" height="17" rx="8.5" fill={o.on ? OK : "transparent"} opacity={o.on ? 0.16 : 1} stroke={o.on ? OK : LINE} strokeWidth="2" />
          <circle cx="78" cy={o.y} r="5" stroke={o.on ? OK : MUTED} strokeWidth="2" fill={o.on ? OK : "none"} />
          <text x="94" y={o.y + 4} fontSize="11" fontWeight="600" fill={o.on ? OK : MUTED} fontFamily="var(--font-plex-sans), sans-serif">Option {o.l}</text>
        </g>
      ))}
      <g className="landing-float">
        <circle cx="190" cy="40" r="17" fill={OK} />
        <path d="M182 40 L188 46 L199 34" stroke="var(--text-on-accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A forgetting curve that is lifted back up by each review. */
export function MemoryArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <path d="M26 22 V122 H220" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 34 C 52 40 62 70 76 92" stroke={DANGER} strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" opacity="0.7" />
      <path d="M30 34 C 48 38 58 54 70 70 L74 38 C 92 42 104 62 120 78 L126 44 C 146 48 160 62 178 76 L184 50 C 198 54 208 60 216 66" stroke={ACC} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {[74, 126, 184].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={[38, 44, 50][i]} r="6" fill={SURFACE} stroke={WARN} strokeWidth="3" />
        </g>
      ))}
      <text x="70" y="140" fontSize="10" fill={MUTED} fontFamily="var(--font-plex-sans), sans-serif">review</text>
      <text x="32" y="16" fontSize="10" fill={MUTED} fontFamily="var(--font-plex-sans), sans-serif">remembered</text>
    </svg>
  );
}

/** A route from today to exam day with the flag at the end. */
export function RoadmapArt(props: P) {
  return (
    <svg viewBox="0 0 240 150" fill="none" aria-hidden="true" {...props}>
      <path d="M22 118 C 62 118 62 74 104 74 S 150 40 190 40" stroke={INK} strokeWidth="9" strokeLinecap="round" opacity="0.88" />
      <path className="landing-dash" d="M22 118 C 62 118 62 74 104 74 S 150 40 190 40" stroke={SURFACE} strokeWidth="2" strokeLinecap="round" />
      <circle cx="62" cy="106" r="7" fill={SURFACE} stroke={PHYS} strokeWidth="3.5" />
      <circle cx="104" cy="74" r="7" fill={SURFACE} stroke={CHEM} strokeWidth="3.5" />
      <circle cx="150" cy="52" r="7" fill={SURFACE} stroke={WARN} strokeWidth="3.5" />
      <path d="M190 40 V10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M190 11 L222 20 L190 30Z" fill={ACC} />
      <rect x="18" y="124" width="58" height="18" rx="9" fill={SURFACE} stroke={LINE} strokeWidth="2" />
      <text x="47" y="136.5" textAnchor="middle" fontSize="10" fontWeight="600" fill={MUTED} fontFamily="var(--font-plex-sans), sans-serif">Today</text>
      <rect x="166" y="124" width="58" height="18" rx="9" fill={SURFACE} stroke={ACC} strokeWidth="2" />
      <text x="195" y="136.5" textAnchor="middle" fontSize="10" fontWeight="600" fill={ACC} fontFamily="var(--font-plex-sans), sans-serif">Exam day</text>
    </svg>
  );
}

/** Night-time desk: the problem the product answers. */
export function NightDeskArt(props: P) {
  return (
    <svg viewBox="0 0 320 220" fill="none" aria-hidden="true" {...props}>
      <circle cx="262" cy="42" r="20" fill={WARN} opacity="0.9" />
      <circle cx="271" cy="36" r="18" fill="var(--bg-main)" />
      <circle cx="40" cy="38" r="2" fill={MUTED} />
      <circle cx="96" cy="22" r="1.6" fill={MUTED} />
      <circle cx="210" cy="30" r="1.8" fill={MUTED} />
      <circle cx="300" cy="90" r="1.6" fill={MUTED} />
      <path d="M10 182 H310" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {/* lamp */}
      <path d="M52 182 V132 L76 98" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 92 L92 112 L82 128Z" fill={WARN} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 140 L120 182 H48Z" fill={WARN} opacity="0.12" />
      {/* book + paper */}
      <rect x="132" y="150" width="88" height="32" rx="3" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
      <path d="M176 150 V182" stroke={INK} strokeWidth="2.5" />
      <rect x="150" y="124" width="104" height="58" rx="3" fill={SURFACE} stroke={INK} strokeWidth="2.5" transform="rotate(-5 202 153)" />
      <text x="166" y="148" fontSize="13" fontWeight="600" fill={DANGER} fontFamily="var(--font-plex-mono), monospace" transform="rotate(-5 202 153)">Q.14  ?</text>
      <path d="M166 160 H236 M166 170 H214" stroke={LINE} strokeWidth="3" strokeLinecap="round" transform="rotate(-5 202 153)" />
      <g className="landing-float-slow">
        <circle cx="236" cy="98" r="16" fill={SURFACE} stroke={DANGER} strokeWidth="2.5" />
        <text x="236" y="105" textAnchor="middle" fontSize="20" fontWeight="700" fill={DANGER} fontFamily="var(--font-plex-sans), sans-serif">?</text>
      </g>
    </svg>
  );
}
