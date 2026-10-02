/** Parse solver practice JSON even when markdown fences / LaTeX preprocess mangled it. */

export type PracticeOption = { id: string; latex: string };

export type InteractivePracticeData = {
  type: "mcq" | "numerical";
  difficulty: string;
  question_text: string;
  options?: PracticeOption[];
  correct_answer: string;
  solution_walkthrough: string;
  distractor_analysis?: Record<string, string>;
};

/** Matches the solver/follow-up practice separator line. */
const PRACTICE_ATTEMPT_SPLIT =
  /─{3,}\s*ATTEMPT (?:THE QUESTION|ALL QUESTIONS)[\s\S]*?─{3,}/i;

const FENCE_RE =
  /```(?:interactive-practice|json)[^\n]*\n([\s\S]*?)```/i;

export function splitPracticeAttempt(
  content: string,
): { question: string; remainder: string } | null {
  if (!content?.trim()) return null;
  const match = content.match(PRACTICE_ATTEMPT_SPLIT);
  if (!match || match.index === undefined) return null;
  const question = content.slice(0, match.index).trim();
  const remainder = content.slice(match.index + match[0].length).trim();
  if (!question) return null;
  return { question, remainder };
}

function parseLooseJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const slice = raw.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    const repaired = slice.replace(/(?<!\\)\\(?![\\/"bfnrtu])/g, "\\\\");
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

function coercePractice(value: unknown): InteractivePracticeData | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const type = obj.type === "numerical" ? "numerical" : obj.type === "mcq" ? "mcq" : null;
  const question = typeof obj.question_text === "string" ? obj.question_text.trim() : "";
  if (!type || !question) return null;

  const options = Array.isArray(obj.options)
    ? obj.options
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const id = String(row.id ?? "").trim();
          const latex = String(row.latex ?? row.text ?? "").trim();
          if (!id || !latex) return null;
          return { id, latex };
        })
        .filter((row): row is PracticeOption => Boolean(row))
    : undefined;

  const distractors =
    obj.distractor_analysis && typeof obj.distractor_analysis === "object"
      ? Object.fromEntries(
          Object.entries(obj.distractor_analysis as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v ?? ""),
          ]),
        )
      : undefined;

  return {
    type,
    difficulty: String(obj.difficulty || "Practice").replace(/_/g, " "),
    question_text: question,
    options,
    correct_answer: String(obj.correct_answer ?? "").trim(),
    solution_walkthrough: String(obj.solution_walkthrough ?? "").trim(),
    distractor_analysis: distractors,
  };
}

export function asPracticeData(value: unknown): InteractivePracticeData | null {
  return coercePractice(value);
}

export function asPracticeBatch(value: unknown): InteractivePracticeData[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => asPracticeData(row))
    .filter((row): row is InteractivePracticeData => Boolean(row));
}

export function looksLikePracticeDump(content: string): boolean {
  const t = (content || "").trim();
  if (!t) return false;
  if (/^```(?:interactive-practice|json)/i.test(t)) return true;
  return t.startsWith("{") && /"type"\s*:\s*"(mcq|numerical)"/.test(t);
}

export function extractPracticeQuestion(
  content: string,
): { data: InteractivePracticeData | null; remainder: string } {
  if (!content?.trim()) return { data: null, remainder: content || "" };

  const fence = content.match(FENCE_RE);
  if (fence && fence.index !== undefined) {
    const data = coercePractice(parseLooseJson(fence[1]));
    if (data) {
      const remainder = (
        content.slice(0, fence.index) + content.slice(fence.index + fence[0].length)
      ).trim();
      return { data, remainder };
    }
  }

  const data = coercePractice(parseLooseJson(content));
  if (!data) return { data: null, remainder: content };

  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  const remainder = `${content.slice(0, start)}${content.slice(end + 1)}`.trim();
  return { data, remainder };
}

// ── Inline multiple-choice options ──────────────────────────────────────────

export type InlineOption = { label: string; text: string };

/** Character ranges inside $…$, $$…$$, \(…\) or \[…\] — never split there. */
function mathMask(text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false);
  const re = /\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]*?(?<!\\)\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    for (let i = m.index; i < m.index + m[0].length; i++) mask[i] = true;
  }
  return mask;
}

const LABEL_SETS = [["1", "2", "3", "4"], ["A", "B", "C", "D"], ["a", "b", "c", "d"]];

/**
 * Split a question whose options are written inline — "… field? (1) E = … (2) E = …"
 * as stored from past papers — into the stem and its options, so each option can
 * sit on its own line. Markers count only outside maths and only as a run of
 * consecutive labels starting from the first (1/A/a), so "f(1)" in an equation
 * or a lone "(2)" in prose never splits a question. Returns null when there is
 * no such run (the text is shown as written).
 */
export function splitInlineOptions(text: string): { stem: string; options: InlineOption[] } | null {
  if (!text) return null;
  const mask = mathMask(text);
  const marker = /(^|[\s.:;?,)])\(\s*([1-4A-Da-d])\s*\)/g;
  const found: { label: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(text)) !== null) {
    const start = m.index + m[1].length;
    if (mask[start]) continue;
    found.push({ label: m[2], start, end: m.index + m[0].length });
  }
  for (const labels of LABEL_SETS) {
    const run: typeof found = [];
    for (const f of found) {
      if (f.label === labels[run.length]) run.push(f);
      if (run.length === labels.length) break;
    }
    if (run.length >= 2) {
      const stem = text.slice(0, run[0].start).trim();
      if (!stem) return null;
      const options = run.map((f, i) => ({
        label: f.label,
        text: text.slice(f.end, i + 1 < run.length ? run[i + 1].start : undefined).trim(),
      }));
      if (options.some((o) => !o.text)) return null;
      return { stem, options };
    }
  }
  return null;
}
