/**
 * Last line of defence: no math span reaches KaTeX unless KaTeX can parse it.
 *
 * `throwOnError: false` protects the *page* — a bad formula renders as red error text
 * instead of crashing the tree. It does not protect the *student*, who sees a red blob
 * where the physics should be. So before rendering, every span is parsed with KaTeX's
 * own parser (the only oracle that agrees with the renderer), and anything it rejects
 * is unwrapped to plain text: still the real formula, still readable, never visibly
 * broken.
 *
 * `katex.__parse` builds the parse tree without laying out HTML, so this is much
 * cheaper than rendering twice, and results are memoised per span.
 */
import katex from "katex";
import {
  preprocessFormulaSlideMath,
  preprocessMarkdownMath,
  preprocessMarkdownMathConservative,
} from "./markdownMath";

const PARSE_CACHE = new Map<string, boolean>();
const CACHE_LIMIT = 500;

/** Does KaTeX accept this span? Memoised — the same formulae recur constantly. */
export function isRenderableMath(body: string, displayMode = false): boolean {
  const key = `${displayMode ? "D" : "I"}:${body}`;
  const cached = PARSE_CACHE.get(key);
  if (cached !== undefined) return cached;

  let ok = false;
  try {
    // `strict: "ignore"` matches the render options in MarkdownMath, so a span that
    // parses here cannot fail there.
    (katex as unknown as { __parse: (s: string, o: object) => unknown }).__parse(body, {
      displayMode,
      strict: "ignore",
      trust: true,
      throwOnError: true,
    });
    ok = true;
  } catch {
    ok = false;
  }

  if (PARSE_CACHE.size >= CACHE_LIMIT) PARSE_CACHE.clear();
  PARSE_CACHE.set(key, ok);
  return ok;
}

const DISPLAY_RE = /\$\$([\s\S]+?)\$\$/g;
const INLINE_RE = /(?<!\\)(?<!\$)\$([^$\n]+?)\$(?!\$)/g;
const CODE_RE = /```[\s\S]*?```|`[^`\n]*`/g;
const CODE_TOKEN = (i: number) => `\uE006CODE${i}\uE007`;

/** Mask code regions: markdown renders no math inside them, so neither do we. */
function protectCode(text: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  const masked = text.replace(CODE_RE, (whole) => {
    blocks.push(whole);
    return CODE_TOKEN(blocks.length - 1);
  });
  return { text: masked, blocks };
}

function restoreCode(text: string, blocks: string[]): string {
  return text.replace(/\uE006CODE(\d+)\uE007/g, (_, i) => blocks[Number(i)] ?? "");
}

/**
 * Replace unparseable math spans with plain text, leaving valid ones untouched.
 *
 * Display math degrades to a fenced block (it was already on its own lines);
 * inline math degrades to inline code, so it stays inside the sentence.
 */
export function hardenMathSpans(text: string): string {
  if (!text || !text.includes("$")) return text;

  // Escaping an unpaired `$` changes which delimiters pair with which, which can
  // expose a span nothing had looked at yet (a lone `\\`, for instance). So veto and
  // re-pair until the text stops changing — two passes in practice, bounded at three.
  let out = text;
  for (let pass = 0; pass < 3; pass++) {
    const { text: masked, blocks } = protectCode(out);
    const before = masked;
    let next = vetoSpans(masked);
    next = escapeUnpairedDollar(next);
    out = restoreCode(next, blocks);
    if (next === before) break;
  }
  return out;
}

/**
 * A span ending in a lone `\` is nearly always a LaTeX line break that a wrapping
 * heuristic clipped off the end of a line. Dropping it usually makes the span valid,
 * which keeps real maths rendering instead of degrading it to text.
 */
function repair(body: string, displayMode: boolean): string | null {
  if (isRenderableMath(body, displayMode)) return body;
  const trimmed = body.replace(/\\+\s*$/, "").trim();
  if (trimmed !== body.trim() && trimmed && isRenderableMath(trimmed, displayMode)) return trimmed;
  return null;
}

function vetoSpans(text: string): string {
  const withDisplay = text.replace(DISPLAY_RE, (whole, body: string) => {
    const fixed = repair(body, true);
    if (fixed === null) return `\n\`\`\`\n${body.trim()}\n\`\`\`\n`;
    return fixed === body ? whole : `$$\n${fixed}\n$$`;
  });
  return withDisplay.replace(INLINE_RE, (whole, body: string) => {
    const fixed = repair(body, false);
    if (fixed === null) return `\`${body.trim()}\``;
    return fixed === body ? whole : `$${fixed}$`;
  });
}

/**
 * Final parity guarantee: an odd number of unescaped `$` means one of them has no
 * partner, and remark-math would let it open a span that runs to the end of the
 * message. Escaping the last one keeps it visible as a literal `$` instead.
 *
 * This runs after the veto because the veto itself removes delimiters, so parity can
 * only be judged once it has finished.
 */
export function escapeUnpairedDollar(text: string): string {
  // Per line, not per document: inline math cannot span a newline, so an unpaired `$`
  // on one line must not be "fixed" by escaping a perfectly good delimiter on another.
  // Display blocks do span lines, so lines inside them are left alone.
  const lines = text.split("\n");
  let insideDisplay = false;
  const out = lines.map((line) => {
    const fences = (line.match(/\$\$/g) || []).length;
    const wasInside = insideDisplay;
    if (fences % 2 === 1) insideDisplay = !insideDisplay;
    if (wasInside || insideDisplay) return line;
    const withoutDisplay = line.replace(/\$\$/g, "");
    const unescaped = withoutDisplay.match(/(?<!\\)\$/g);
    if (!unescaped || unescaped.length % 2 === 0) return line;
    const last = line.lastIndexOf("$");
    if (last < 0) return line;
    return `${line.slice(0, last)}\\$${line.slice(last + 1)}`;
  });
  return out.join("\n");
}

/** Count spans KaTeX would reject — for diagnostics and tests, not the render path. */
export function countBrokenSpans(text: string): number {
  let broken = 0;
  const afterDisplay = text.replace(DISPLAY_RE, (_whole, body: string) => {
    if (!isRenderableMath(body, true)) broken++;
    return "\n";
  });
  afterDisplay.replace(INLINE_RE, (_whole, body: string) => {
    if (!isRenderableMath(body, false)) broken++;
    return "";
  });
  return broken;
}


/** Problems a rendered string would still show: unparseable spans + odd delimiters. */
function problemCount(text: string): number {
  const withoutCode = text.replace(CODE_RE, "");
  const dollars = (withoutCode.match(/(?<!\\)\$/g) || []).length;
  return countBrokenSpans(text) + (dollars % 2);
}

/** Valid math spans, so "renders nothing at all" cannot win on problem count alone. */
function renderableSpanCount(text: string): number {
  let n = 0;
  const withoutCode = text.replace(CODE_RE, "");
  const afterDisplay = withoutCode.replace(DISPLAY_RE, (_whole, body: string) => {
    if (isRenderableMath(body, true)) n++;
    return "\n";
  });
  afterDisplay.replace(INLINE_RE, (_whole, body: string) => {
    if (isRenderableMath(body, false)) n++;
    return "";
  });
  return n;
}

/**
 * The full chat pipeline, with a guarantee attached: preprocessing may not make a
 * message worse.
 *
 * `preprocessMarkdownMath` has to guess where maths starts and ends in prose, and on
 * half-delimited source text those guesses collide with the delimiters already
 * present. So both pipelines run, KaTeX scores them, and the better one wins — the
 * aggressive one when it helps, the conservative one when it does not.
 */
export function prepareMathMarkdown(raw: string, mode: "full" | "formula" = "full"): string {
  if (!raw?.trim()) return "";
  if (mode === "formula") return hardenMathSpans(preprocessFormulaSlideMath(raw));

  const aggressive = hardenMathSpans(preprocessMarkdownMath(raw));
  const conservative = hardenMathSpans(preprocessMarkdownMathConservative(raw));

  // Correctness first, then coverage: a pipeline that quietly drops delimiters would
  // otherwise "win" by rendering no maths at all. Ties go to the aggressive pass,
  // which is the one that finds maths in undelimited prose.
  const score = (text: string) => problemCount(text) * 1000 - renderableSpanCount(text);
  return score(conservative) < score(aggressive) ? conservative : aggressive;
}
