/**
 * Normalize markdown + LaTeX before react-markdown / KaTeX rendering.
 *
 * Responsibility split (Phase 4):
 * - **Agent** `prepare_student_markdown` / `_as_katex_block` = source of truth for
 *   outbound student text and formula slides (delimit + unicode + equation wrap).
 * - **Frontend** here = residual repair only for chat/cards: unpaired `$`,
 *   `\[…\]`/`\(…)`, stray `\\n`, lightly wrapping truly bare TeX that slipped through.
 * - Formula slides use `preprocessFormulaSlideMath` — do NOT re-wrap aggressively.
 */

const PRACTICE_FENCE_RE = /```interactive-practice[\s\S]*?```/gi;

function protectPracticeFences(raw: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  const text = raw.replace(PRACTICE_FENCE_RE, (full) => {
    const idx = blocks.length;
    blocks.push(full);
    return `\uE010PRAC${idx}\uE011`;
  });
  return { text, blocks };
}

function restorePracticeFences(text: string, blocks: string[]): string {
  return text.replace(/\uE010PRAC(\d+)\uE011/g, (_, i) => blocks[Number(i)] ?? "");
}

const UNICODE_MATH: Record<string, string> = {
  ω: "\\omega",
  Ω: "\\Omega",
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  Γ: "\\Gamma",
  τ: "\\tau",
  θ: "\\theta",
  Σ: "\\sum",
  π: "\\pi",
  μ: "\\mu",
  "²": "^2",
  "³": "^3",
  "×": "\\times",
  "·": "\\cdot",
  "→": "\\to",
};

/**
 * `\omega` followed immediately by a letter is a different, undefined macro: "2πf"
 * converted to "2\pif", which KaTeX rejects. Replacements therefore keep a space when
 * a letter follows.
 */
const UNICODE_NEEDS_SPACE = /^\\[a-zA-Z]/;

const N_MACROS =
  "nu|nabla|neq|ne|notin|ni|nless|ngtr|napprox|ncong|nmid|nparallel|nrightarrow|nRightarrow|nleftarrow|nLeftarrow|nexists|nsubseteq|nsupseteq";

const N_MACRO_RE = new RegExp(String.raw`\\(?:${N_MACROS})(?![a-zA-Z])`, "g");
const IMAGE_PLACEHOLDER_PREFIX = "\uE000IMG";
const ESCAPED_DOLLAR_TOKEN = "\uE004ESCDOLLAR\uE005";
const AUTHOR_DISPLAY_TOKEN = (i: number) => `\uE00ADISP${i}\uE00B`;

/**
 * `\[ … \]` is an explicit request for display maths, so it is protected rather than
 * treated as a guess: no heuristic rewraps it, and `inlineDisplaySpansToInline` does not
 * downgrade it just because prose follows on the same line.
 */
function protectAuthorDisplay(text: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  const masked = text.replace(/\\\[([\s\S]+?)\\\]/g, (_whole, inner: string) => {
    blocks.push(`$$\n${String(inner).trim()}\n$$`);
    return AUTHOR_DISPLAY_TOKEN(blocks.length - 1);
  });
  return { text: masked, blocks };
}

function restoreAuthorDisplay(text: string, blocks: string[]): string {
  return text.replace(/\uE00ADISP(\d+)\uE00B/g, (_, i) => blocks[Number(i)] ?? "");
}

/**
 * An escaped `\$` is a literal dollar sign the agent deliberately protected (a price,
 * "costs \$0.0900 per kWh"). The wrapping heuristics below see only a backslash and a
 * digit, so they used to wrap the escape itself as maths — turning a table of values
 * into `$$\n\\\n$$$1036\\$`. Masking it keeps every heuristic away from it.
 */
function protectEscapedDollars(text: string): string {
  return text.replace(/\\\$/g, ESCAPED_DOLLAR_TOKEN);
}

function restoreEscapedDollars(text: string): string {
  return text.split(ESCAPED_DOLLAR_TOKEN).join("\\$");
}

const MONEY_BODY_RE = /^\s*\d[\d,]*(?:\.\d+)?\s*(?:per\s+\w+|each|a\s+\w+|an\s+\w+|billion|million|thousand)?\s*$/i;
const MONEY_CUE_RE = /\b(?:per|each|a\s+\w+|an\s+\w+|billion|million|thousand|dollars?|cents?)\b|\.\d{2}\b/i;
const MATH_EVIDENCE_RE = /[\\^_={}]|\\[a-zA-Z]+/;

/**
 * Escape `$` that introduces money rather than maths — the same rule the agent applies
 * in `utils/latex_guidelines.escape_currency_dollars`. Duplicated deliberately: cards
 * and stored content reach this component without passing through the agent's outbound
 * pass, and an unescaped price swallows the rest of the sentence.
 */
export function escapeCurrencyDollars(text: string): string {
  if (!text.includes("$")) return text;
  let out = text.replace(/(?<!\\)\$([^$\n]{1,120}?)(?<!\\)\$/g, (whole, body: string) => {
    if (MATH_EVIDENCE_RE.test(body)) return whole;
    if (MONEY_CUE_RE.test(body) && MONEY_BODY_RE.test(body)) return `\\$${body}\\$`;
    // No macro, no operator, several English words *and* it starts at an amount:
    // "a $5 note and a $10 note". Without the leading-digit test this also matched the
    // prose between two legitimate formulas and escaped their delimiters.
    if (/^\d/.test(body.trim()) && (body.match(/[A-Za-z]{2,}/g) || []).length >= 2) {
      return `\\$${body}\\$`;
    }
    return whole;
  });
  out = out
    .split("\n")
    .map((line) => {
      const unescaped = line.match(/(?<!\\)\$/g);
      if (!unescaped || unescaped.length % 2 === 0) return line;
      return line.replace(/(?<!\\)\$(?=\d)/, "\\$");
    })
    .join("\n");
  return out;
}

/**
 * A span holding a whole English sentence is the model breaking the prompt's rule 6.
 * KaTeX renders it — badly, as italic run-together text — so it is unwrapped instead.
 */
export function unwrapSentenceMath(text: string): string {
  // Pair delimiters left to right, every span regardless of length, and only then
  // decide. Requiring 8+ chars inside the pattern (as this used to) made the scan
  // skip `$C$`, restart on its CLOSING `$`, and pair every later delimiter wrong:
  // "a capacitor $C$ and an inductor $L$, and we want … of $L$?" lost the `$`
  // after the first L and rendered the rest of the sentence as italic maths.
  return text.replace(/(?<![\\$])\$(?!\$)([^$\n]*?)(?<!\\)\$(?!\$)/g, (whole, body: string) => {
    if (body.length < 8 || body.length > 400) return whole;
    if (MATH_EVIDENCE_RE.test(body)) return whole;
    const words = body.match(/[A-Za-z]{2,}/g) || [];
    return words.length >= 4 ? body : whole;
  });
}

/** Lines / fragments that are clearly TeX (macros, ^, _, = with math). */
const LATEX_LINE_RE =
  /\\(?:Gamma|gamma|vec|frac|sum|prod|int|partial|nabla|cdot|times|quad|qquad|sin|cos|tan|alpha|beta|theta|tau|omega|Omega|pi|mu|nu|text|mathrm|mathbf|left|right|overline|underline|hat|bar|dot|ddot|parallel|perp|approx|equiv|leq|geq|neq|infty|rightarrow|leftarrow)\b|[=^_]/;

function protectNMacros(text: string): { text: string; macros: string[] } {
  const macros: string[] = [];
  const next = text.replace(N_MACRO_RE, (full) => {
    const idx = macros.length;
    macros.push(full);
    return `\uE002N${idx}\uE003`;
  });
  return { text: next, macros };
}

function restoreNMacros(text: string, macros: string[]): string {
  return text.replace(/\uE002N(\d+)\uE003/g, (_, i) => macros[Number(i)] ?? "");
}

function replaceStrayN(text: string, replacement: string): string {
  const guarded = protectNMacros(text);
  const next = guarded.text.replace(/\\\\n/g, replacement).replace(/\\n/g, replacement);
  return restoreNMacros(next, guarded.macros);
}

function protectImages(text: string): { text: string; images: string[] } {
  const images: string[] = [];
  const next = text.replace(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (full) => {
    const idx = images.length;
    images.push(full);
    return `${IMAGE_PLACEHOLDER_PREFIX}${idx}\uE001`;
  });
  return { text: next, images };
}

function restoreImages(text: string, images: string[]): string {
  return text.replace(/\uE000IMG(\d+)\uE001/g, (_, i) => images[Number(i)] ?? "");
}

function splitFormulaSeparators(raw: string): string[] {
  return replaceStrayN(raw, "\n")
    .replace(/\|+/g, "\n")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function englishWordCount(text: string): number {
  const stripped = text.replace(/\\[a-zA-Z]+/g, " ").replace(/\\\{|\\\}/g, " ");
  return (stripped.match(/[A-Za-z]{3,}/g) || []).length;
}

/**
 * Two or more real English words in a row (after stripping macros) reads as a
 * sentence, not a formula — even if it also contains 2+ macros (e.g. "Angular
 * speed \omega = 2\pi f in SHM." has 2 macros and only 3 counted words, but
 * "Angular speed" / "in SHM" are plain prose). Bug found 2026-09-11: without
 * this veto, isLatexHeavy wrongly wrapped whole sentences like that as one
 * display-math block, gluing every word together edge-to-edge under KaTeX.
 */
function hasConsecutiveEnglishWords(text: string): boolean {
  const stripped = text.replace(/\\[a-zA-Z]+/g, " ");
  return /[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(stripped);
}

function isLatexHeavy(text: string): boolean {
  const s = text.trim();
  if (!s) return false;
  if (!LATEX_LINE_RE.test(s) && !/[\\^_]/.test(s)) return false;
  if (hasConsecutiveEnglishWords(s)) return false;
  // Prefer math when macros dominate, or line is short equation-like
  const words = englishWordCount(s);
  const macros = (s.match(/\\[a-zA-Z]+/g) || []).length;
  // One macro + several English words → mixed prose/equation; wrap fragments only.
  if (macros >= 1 && words <= 2) return true;
  if (macros >= 2 && words <= 4) return true;
  if (/[=\\]/.test(s) && words <= 2 && s.length <= 180) return true;
  return false;
}

/** Collapse JSON/LLM double-escaped macros: \\vec → \vec */
function collapseDoubleEscapedMacros(text: string): string {
  // Repeat to handle \\\\, etc., but stop when stable
  let prev = "";
  let out = text;
  while (out !== prev) {
    prev = out;
    out = out.replace(/\\\\([a-zA-Z]+)/g, "\\$1");
  }
  return out;
}

/**
 * Wrap short inline assignments in prose: a_1 = \frac{F}{M_1} → $a_1 = \frac{F}{M_1}$
 * Mirrors agent `_wrap_equation_fragments` for residual DB text.
 */
function wrapEquationFragments(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  const fragRe =
    /(?<![\\$])((?:\\[a-zA-Z]+|[A-Za-z])[\w]*(?:_\{?[A-Za-z0-9]+\}?|\^[{}\d]+)?\s*=\s*(?:\\[a-zA-Z]+(?:\{[^{}]{0,40}\})*|-?\d+(?:\.\d+)?(?:\s*(?:kg|g|m|s|N|J|W|Pa|rad|deg|°|\/s(?:\^?2)?|m\/s(?:\^?2)?))?|[A-Za-z\\][\w\\^_{}]{0,20}))/g;

  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return part
        .split("\n")
        .map((line) => {
          if (line.includes("$") || line.length > 120) return line;
          return line.replace(fragRe, (fragment) => {
            const trimmed = fragment.trim();
            if (trimmed.length > 48 || trimmed.split(/\s+/).length > 4) return fragment;
            const rhs = trimmed.split("=", 2)[1] ?? "";
            const rhsWords = rhs
              .replace(/\\[a-zA-Z]+/g, " ")
              .replace(/[^A-Za-z\s]/g, " ")
              .split(/\s+/)
              .filter((w) => w.length >= 3);
            if (rhsWords.length > 0) return fragment;
            return `$${trimmed}$`;
          });
        })
        .join("\n");
    })
    .join("");
}

/**
 * Skips segments already inside $...$ / $$...$$.
 */
function wrapInlineLatexFragments(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      let out = part;
      // \alpha, \approx, \vec{F}_{ij}, \sin\theta, 6^{\circ}, etc.
      out = out.replace(
        /\\[a-zA-Z]+(?:\s*\{[^{}]*\})*(?:_\{[^{}]*\}|_[A-Za-z0-9]+|\^\{[^{}]*\}|\^[A-Za-z0-9]+|\\[a-zA-Z]+)*/g,
        (frag) => `$${frag}$`,
      );
      // Degree-like power: 6^{\circ} (when not already preceded by \)
      out = out.replace(
        /(\d+(?:\.\d+)?)\^\{(\\circ)\}/g,
        (_m, num, circ) => `$${num}^{${circ}}$`,
      );
      return out;
    })
    .join("");
}

/**
 * Wrap undelimited latex lines in $$...$$ so KaTeX can render them.
 * Leave markdown headings/lists/prose alone.
 */
function wrapUndelimitedLatex(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part; // already math
      return part
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          // Skip markdown structure
          if (/^(#{1,6}\s|[-*]\s|\d+\.\s|\|)/.test(trimmed)) return line;
          if (/^\*\*[^*].*\*\*:?\s*$/.test(trimmed)) return line;
          // List label + formula: "**Torque:** \vec{\tau}=..."
          const labeled = trimmed.match(/^(\*\*[^*]+\*\*:?\s+)(.+)$/);
          if (labeled && isLatexHeavy(labeled[2])) {
            return `${labeled[1]}$$\n${labeled[2].trim()}\n$$`;
          }
          if (isLatexHeavy(trimmed) && !trimmed.includes("$")) {
            const indent = line.match(/^\s*/)?.[0] ?? "";
            return `${indent}$$\n${trimmed}\n$$`;
          }
          return line;
        })
        .join("\n");
    })
    .join("");
}

/**
 * Smart cleanup of $$ blocks:
 * - strip nested $
 * - split packed formulas on \n
 * - if mixed prose+math, keep math lines as $$ and prose as text (don't dump naked latex)
 */
function cleanDisplayMathBlocks(text: string): string {
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (_full, inner: string) => {
    const raw = String(inner).split("$").join("").trim();
    if (!raw) return "";

    const lines = splitFormulaSeparators(raw);
    if (!lines.length) return "";

    const mathLines = lines.filter(isLatexHeavy);
    const proseLines = lines.filter((l) => !isLatexHeavy(l));

    // Pure / mostly math → keep as math blocks
    if (mathLines.length > 0 && proseLines.length === 0) {
      return mathLines.map((p) => `$$\n${p.replace(/\s+/g, " ").trim()}\n$$`).join("\n\n");
    }

    // Mixed: emit math as $$ and prose as normal markdown (with delimiters fixed)
    if (mathLines.length > 0 && proseLines.length > 0) {
      const mathPart = mathLines.map((p) => `$$\n${p.replace(/\s+/g, " ").trim()}\n$$`).join("\n\n");
      const prosePart = proseLines.join("\n\n");
      return `\n\n${mathPart}\n\n${prosePart}\n\n`;
    }

    // All prose mistakenly wrapped
    if (englishWordCount(raw) >= 6) {
      return `\n\n${replaceStrayN(raw, "\n")}\n\n`;
    }

    return `$$\n${raw.replace(/\s+/g, " ").trim()}\n$$`;
  });
}

function expandLiteralNewlinesInProse(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      return replaceStrayN(part, "\n");
    })
    .join("");
}

/** Short OCR/diagram token lines (COM, L, 2, m, v₀) — not standalone sentences. */
function isDiagramLayoutFragment(line: string): boolean {
  const s = line.trim();
  if (!s || s.length > 36) return false;
  if (/^\(\d+\)\s+\S/.test(s) && s.length > 18) return false;
  if (/[.!?]/.test(s)) return false;
  if (isLatexHeavy(s)) return false;
  if (englishWordCount(s) > 3) return false;
  return true;
}

/**
 * Join consecutive diagram-label lines into one prose line so KaTeX/markdown
 * does not stack each token vertically (common in DB solution OCR text).
 */
function collapseDiagramLines(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      const lines = part.split("\n");
      const out: string[] = [];
      let buffer: string[] = [];

      const flush = () => {
        if (buffer.length === 0) return;
        out.push(buffer.length === 1 ? buffer[0] : buffer.join(" "));
        buffer = [];
      };

      for (const line of lines) {
        if (!line.trim()) {
          flush();
          out.push("");
          continue;
        }
        if (isDiagramLayoutFragment(line)) {
          buffer.push(line.trim());
        } else {
          flush();
          out.push(line);
        }
      }
      flush();
      return out.join("\n");
    })
    .join("");
}

/** Escape unpaired `$` so remark-math never swallows whole paragraphs. */
export function balanceMathDelimiters(text: string): string {
  const chars = [...text];
  const openIndexes: number[] = [];
  let i = 0;
  while (i < chars.length) {
    if (chars[i] === "$" && chars[i + 1] === "$") {
      i += 2;
      continue;
    }
    if (chars[i] === "$") {
      if (openIndexes.length) openIndexes.pop();
      else openIndexes.push(i);
    }
    i += 1;
  }
  for (const idx of openIndexes) {
    chars[idx] = "\\$";
  }
  return chars.join("");
}

export function unicodeMathToLatex(text: string): string {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part;
      let out = part;
      for (const [symbol, latex] of Object.entries(UNICODE_MATH)) {
        if (!out.includes(symbol)) continue;
        // Keep a space when a letter follows, or `\pi` + `f` becomes the undefined
        // macro `\pif` and the whole span fails to parse.
        out = out.replace(
          new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          (_m, offset: number, whole: string) => {
            const next = whole[offset + symbol.length] ?? "";
            const needsSpace = UNICODE_NEEDS_SPACE.test(latex) && /[a-zA-Z]/.test(next);
            return needsSpace ? `${latex} ` : latex;
          },
        );
      }
      return out;
    })
    .join("");
}

export function extractMarkdownImageUrls(raw: string): string[] {
  if (!raw) return [];
  const urls: string[] = [];
  const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

/**
 * Bare DB formula string → $$ blocks (used when agent skipped wrapping).
 * Preserves \\nu when splitting on literal \\n.
 */
export function normalizeFormulaMarkdown(raw: string): string {
  if (!raw?.trim()) return raw;
  let text = collapseDoubleEscapedMacros(raw);
  if (text.includes("$$")) {
    return cleanDisplayMathBlocks(text);
  }
  const pieces = splitFormulaSeparators(text.replace(/\$/g, " "));
  if (!pieces.length) return text;
  return pieces.map((p) => `$$\n${p}\n$$`).join("\n\n");
}

/**
 * Residual repair for formula slides that the agent already wrapped via
 * `_as_katex_block`. Skips aggressive undelimited / inline re-wrapping.
 */
export function preprocessFormulaSlideMath(raw: string): string {
  if (!raw?.trim()) return raw;
  let text = collapseDoubleEscapedMacros(raw);
  text = expandLiteralNewlinesInProse(text);
  text = collapseDiagramLines(text);
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$\n${String(inner).trim()}\n$$`);
  text = text.replace(/\\\((.+?)\\\)/g, (_, inner) => `$${String(inner).trim()}$`);
  if (!text.includes("$$") && !/(?:^|[^\\])\$/.test(text)) {
    return normalizeFormulaMarkdown(text);
  }
  text = cleanDisplayMathBlocks(text);
  text = balanceMathDelimiters(text);
  return text;
}

/** Chat / flashcard / notes path — residual wrap for anything that slipped past the agent. */
/**
 * Display math must own its line. The wrapping heuristics above can emit `$$…$$`
 * in the middle of a sentence, and when the next fragment is inline math the two
 * delimiters collide into `$$$`, which mis-pairs everything after it on the line.
 * Downgrading a mid-sentence display span to inline keeps the maths and the pairing.
 */
function inlineDisplaySpansToInline(text: string): string {
  return text.replace(/\$\$\s*([^$]+?)\s*\$\$/g, (whole, body: string, offset: number) => {
    const before = text.slice(0, offset);
    const after = text.slice(offset + whole.length);
    const atLineStart = before === "" || /\n[ \t]*$/.test(before);
    const atLineEnd = after === "" || /^[ \t]*\n/.test(after);
    if (atLineStart && atLineEnd) return whole;
    return `$${String(body).replace(/\s*\n\s*/g, " ").trim()}$`;
  });
}

/**
 * Separate and space inline spans so markdown can actually see them.
 *
 * Wrapping fragments independently can leave two spans touching — "2πf" becomes
 * `$\omega = 2$$\pi$ f`, where the `$$` reads as a display delimiter and mis-pairs
 * everything after it. And `have$E$` (no space before the opening `$`) is not reliably
 * parsed as maths at all. Both are fixed by inserting the missing whitespace.
 */
function tidyInlineSpans(text: string): string {
  let out = text;
  // close + open mistaken for a display delimiter (both sides non-space, non-$)
  out = out.replace(/(?<=[^\s$])\$\$(?=[^\s$])/g, "$ $");
  // A word running straight into an opening delimiter, or out of a closing one.
  // Walk real pairs: a lookahead rule cannot tell opening from closing, and it used
  // to turn "a capacitor $C$ and" into "$C $and", gluing the next word to the maths.
  out = out.replace(/(?<![\\$])\$(?!\$)([^$\n]+?)(?<!\\)\$(?!\$)/g, (span, _body, offset: number, whole: string) => {
    const before = whole[offset - 1] ?? "";
    const after = whole[offset + span.length] ?? "";
    const lead = /[A-Za-z0-9]/.test(before) ? " " : "";
    const tail = /[A-Za-z0-9]/.test(after) ? " " : "";
    return `${lead}${span}${tail}`;
  });
  return out;
}

/**
 * Display blocks must stand alone, or remark-math never sees them.
 *
 * `…condition is $$\nv = \omega R\n$$` looks like display maths but is not: block math
 * has to begin its own line, and inline math cannot contain a newline, so remark-math
 * treats the whole thing as literal text and the student reads `$$` on screen. Giving
 * every block a blank line either side is what makes it parse.
 */
function ensureDisplayBlocksStandAlone(text: string): string {
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (whole, body: string, offset: number) => {
    const before = text.slice(0, offset);
    const after = text.slice(offset + whole.length);
    const lead = before === "" || /\n\s*\n[ \t]*$/.test(before) ? "" : "\n\n";
    const tail = after === "" || /^[ \t]*\n\s*\n/.test(after) ? "" : "\n\n";
    const inner = String(body).trim();
    return `${lead}$$\n${inner}\n$$${tail}`;
  });
}

export function preprocessMarkdownMath(raw: string): string {
  if (!raw?.trim()) return raw;

  const { text: withoutPractice, blocks: practiceBlocks } = protectPracticeFences(raw);
  const { text: protectedText, images } = protectImages(withoutPractice);
  let text = protectEscapedDollars(escapeCurrencyDollars(protectedText));
  const authored = protectAuthorDisplay(text);
  text = authored.text;

  text = collapseDoubleEscapedMacros(text);
  text = text.replace(/\\\((.+?)\\\)/g, (_, inner) => `$${String(inner).trim()}$`);
  text = unwrapSentenceMath(text);
  text = expandLiteralNewlinesInProse(text);
  text = collapseDiagramLines(text);
  // Unicode → TeX before wrapping so ω becomes \omega and then gets delimited.
  text = unicodeMathToLatex(text);
  text = cleanDisplayMathBlocks(text);
  text = wrapUndelimitedLatex(text);
  text = wrapEquationFragments(text);
  text = wrapInlineLatexFragments(text);
  text = balanceMathDelimiters(text);
  text = cleanDisplayMathBlocks(text);
  text = wrapUndelimitedLatex(text);
  text = inlineDisplaySpansToInline(text);
  text = tidyInlineSpans(text);
  text = restoreAuthorDisplay(text, authored.blocks);
  text = ensureDisplayBlocksStandAlone(text);
  text = restoreEscapedDollars(text);
  text = restoreImages(text, images);
  text = restorePracticeFences(text, practiceBlocks);
  return text;
}

/**
 * Conservative preprocessing: normalise what is unambiguous (TeX delimiters, unicode
 * symbols, stray literal newlines) and *never* guess where maths begins in prose.
 *
 * `prepareMathMarkdown` falls back to this when the wrapping heuristics above make a
 * message worse rather than better. Half-delimited source text is the case that does
 * it: wrapping each macro separately produces `$$…$$` runs that collide with the
 * delimiters already there.
 */
export function preprocessMarkdownMathConservative(raw: string): string {
  if (!raw?.trim()) return raw;
  const { text: withoutPractice, blocks: practiceBlocks } = protectPracticeFences(raw);
  const { text: protectedText, images } = protectImages(withoutPractice);
  let text = protectEscapedDollars(escapeCurrencyDollars(protectedText));
  const authored = protectAuthorDisplay(text);
  text = authored.text;

  text = collapseDoubleEscapedMacros(text);
  text = text.replace(/\\\((.+?)\\\)/g, (_, inner) => `$${String(inner).trim()}$`);
  text = unwrapSentenceMath(text);
  text = expandLiteralNewlinesInProse(text);
  // Unicode → TeX only where it is already inside maths. Converting ω to \omega out in
  // the prose and then not wrapping it (this path does no wrapping) would print the
  // macro name to the student.
  text = text.replace(/(\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]*?(?<!\\)\$)/g, (span) =>
    unicodeMathToLatex(span),
  );
  text = cleanDisplayMathBlocks(text);
  text = balanceMathDelimiters(text);
  text = restoreAuthorDisplay(text, authored.blocks);
  text = ensureDisplayBlocksStandAlone(text);
  text = restoreEscapedDollars(text);
  text = restoreImages(text, images);
  text = restorePracticeFences(text, practiceBlocks);
  return text;
}

/** Golden JEE-like fixtures for chat + formula-slide paths (Phase 4). */
export type MathFixture = {
  id: string;
  surface: "chat" | "formula";
  input: string;
  /** Substrings that must appear after preprocess (delimiter-stable). */
  mustInclude: string[];
  /** Substrings that must NOT appear (regression guards). */
  mustNotInclude?: string[];
};

export const MATH_GOLDEN_FIXTURES: MathFixture[] = [
  {
    // Study Room, 2026-10-02: a short span ($C$) before two longer ones used to
    // shift delimiter pairing, so the rest of the bold question rendered as maths.
    id: "short-span-does-not-shift-pairing",
    surface: "chat",
    input:
      '**If we have a capacitor $C$ and an inductor $L$, and we want the "sloshing" to happen faster, should we increase or decrease the value of $L$?**',
    mustInclude: ["$C$ and an inductor $L$, and we want", "the value of $L$?"],
    mustNotInclude: ["$C $and", "$L, and"],
  },
  {
    id: "nu-macro-survives-stray-n-split",
    surface: "formula",
    input: "F=m\\nu\\nE=mc^2",
    mustInclude: ["\\nu", "$$"],
    mustNotInclude: ["\\nE"],
  },
  {
    id: "already-wrapped-formula-not-doubled",
    surface: "formula",
    input: "$$\n\\vec{\\tau}=\\vec{r}\\times\\vec{F}\n$$",
    mustInclude: ["\\vec{\\tau}", "$$"],
  },
  {
    id: "unicode-omega-becomes-macro",
    surface: "chat",
    input: "Angular speed ω = 2πf in SHM.",
    mustInclude: ["\\omega", "Angular speed"],
    mustNotInclude: ["Angularspeed", "$$\nAngular"],
  },
  {
    id: "sentence-with-two-macros-not-glued-as-one-math-block",
    surface: "chat",
    input:
      "For small oscillations, the time period is T = 2\\pi\\sqrt{L/g} where L is the length.",
    mustInclude: ["For small oscillations", "where L is the length"],
    mustNotInclude: ["Forsmall", "wherelis"],
  },
  {
    id: "bare-frac-wrapped",
    surface: "chat",
    input: "I=\\frac{1}{2}MR^2",
    mustInclude: ["$$", "\\frac{1}{2}"],
  },
  {
    id: "english-prose-not-wrapped",
    surface: "chat",
    input: "Torque is the turning effect of a force about a point.",
    mustInclude: ["Torque is the turning effect"],
    mustNotInclude: ["$$"],
  },
  {
    id: "bracket-delimiters-normalized",
    surface: "chat",
    input: "Use \\[ F = ma \\] for Newton's second law.",
    mustInclude: ["$$", "F = ma"],
  },
  {
    id: "diagnostic-mixed-prose-equation",
    surface: "chat",
    input:
      "Analyzing system from Non Inertial frame of reference of block M_1\nThe acceleration of block M_1, a_1 = \\frac{F}{M_1+M_2+M_3}",
    mustInclude: ["Analyzing system", "$a_1 = \\frac{F}{M_1+M_2+M_3}$"],
    mustNotInclude: ["$$\nThe acceleration"],
  },
  {
    id: "practice-fence-not-split-by-display-math",
    surface: "chat",
    input:
      "```interactive-practice\n{\"type\":\"mcq\",\"question_text\":\"mass $m$\",\"solution_walkthrough\":\"$$\\\\tau = I\\\\alpha$$\",\"correct_answer\":\"A\"}\n```",
    mustInclude: ["```interactive-practice", "question_text"],
    mustNotInclude: ["\uE010PRAC"],
  },
  {
    id: "diagram-label-lines-collapsed",
    surface: "chat",
    input:
      "mv_0 = Mv ...(i)\\n(2) Net torque on the system about COM of rod is zero.\\nCOM\\nL\\n2\\nBefore collision\\nm\\nv_0\\nω",
    mustInclude: ["COM L 2 Before collision m v_0", "(2) Net torque"],
    mustNotInclude: ["COM\nL\n2\nBefore"],
  },
];

export function assertMathFixtures(
  fixtures: MathFixture[] = MATH_GOLDEN_FIXTURES,
): { id: string; ok: boolean; detail?: string }[] {
  return fixtures.map((fx) => {
    const out =
      fx.surface === "formula"
        ? preprocessFormulaSlideMath(fx.input)
        : preprocessMarkdownMath(fx.input);
    for (const needle of fx.mustInclude) {
      if (!out.includes(needle)) {
        return { id: fx.id, ok: false, detail: `missing ${JSON.stringify(needle)} in ${JSON.stringify(out)}` };
      }
    }
    for (const needle of fx.mustNotInclude || []) {
      if (out.includes(needle)) {
        return { id: fx.id, ok: false, detail: `unexpected ${JSON.stringify(needle)} in ${JSON.stringify(out)}` };
      }
    }
    return { id: fx.id, ok: true };
  });
}
