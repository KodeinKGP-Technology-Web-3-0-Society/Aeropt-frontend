/**
 * Plain prose for the tutor's replies: no em dashes, no stock chatbot openers.
 *
 * The tutor is told to write this way (agent skills/learning_agent.yaml); this is the safety
 * net for what slips through. It runs at render time on tutor messages only — never on
 * question text from NCERT or official papers, where changing a character could change the
 * question — and never inside maths ($…$, $$…$$, \(…\), \[…\]) or code (`…`, ``` fences).
 * Streamed text is cleaned the same way on every render, so a dash split across chunks is
 * still handled once the chunk after it arrives.
 */

const PROTECTED = /```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]*?(?<!\\)\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g;

const OPENERS =
  /^\s*(?:(?:great|excellent|good|nice|wonderful|fantastic) question[!.]?|certainly[!.]|absolutely[!.]|of course[!.])\s*/i;

function cleanProse(text: string, atStart: boolean): string {
  let out = text;
  if (atStart) out = out.replace(OPENERS, "");
  out = out
    // a dash opening a line reads as a bullet: make it one
    .replace(/(^|\n)[ \t]*—[ \t]+/g, "$1- ")
    // "a — b", "a—b", "a —b": a clause break, written as a comma
    .replace(/[ \t]*—[ \t]*/g, ", ")
    // the comma that a dash before punctuation would leave behind
    .replace(/, ([.,;:!?)])/g, "$1")
    .replace(/\bdelve(s|d)? into\b/gi, (_m, s: string | undefined) => (s === "d" ? "looked at" : s ? "looks at" : "look at"))
    .replace(/\blet['’]s dive in\b/gi, (m: string) => (m[0] === "L" ? "Let's start" : "let's start"));
  return out;
}

export function plainProse(markdown: string): string {
  if (!markdown || (!markdown.includes("—") && !OPENERS.test(markdown) && !/delve|dive in/i.test(markdown))) {
    return markdown;
  }
  let out = "";
  let last = 0;
  for (const m of markdown.matchAll(PROTECTED)) {
    const start = m.index ?? 0;
    out += cleanProse(markdown.slice(last, start), last === 0) + m[0];
    last = start + m[0].length;
  }
  return out + cleanProse(markdown.slice(last), last === 0);
}
