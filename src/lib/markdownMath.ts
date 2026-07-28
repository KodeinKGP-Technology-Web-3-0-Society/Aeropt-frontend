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

const N_MACROS =
  "nu|nabla|neq|ne|notin|ni|nless|ngtr|napprox|ncong|nmid|nparallel|nrightarrow|nRightarrow|nleftarrow|nLeftarrow|nexists|nsubseteq|nsupseteq";

const N_MACRO_RE = new RegExp(String.raw`\\(?:${N_MACROS})(?![a-zA-Z])`, "g");
const IMAGE_PLACEHOLDER_PREFIX = "\uE000IMG";

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

function isLatexHeavy(text: string): boolean {
  const s = text.trim();
  if (!s) return false;
  if (!LATEX_LINE_RE.test(s) && !/[\\^_]/.test(s)) return false;
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
        out = out.split(symbol).join(latex);
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
export function preprocessMarkdownMath(raw: string): string {
  if (!raw?.trim()) return raw;

  const { text: protectedText, images } = protectImages(raw);
  let text = protectedText;

  text = collapseDoubleEscapedMacros(text);
  text = text.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `$$\n${String(inner).trim()}\n$$`);
  text = text.replace(/\\\((.+?)\\\)/g, (_, inner) => `$${String(inner).trim()}$`);
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
  text = restoreImages(text, images);
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
    mustInclude: ["\\omega"],
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
