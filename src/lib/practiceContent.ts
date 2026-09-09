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
