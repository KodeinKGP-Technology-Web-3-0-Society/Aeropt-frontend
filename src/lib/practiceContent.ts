/** Matches the solver/follow-up practice separator line. */
const PRACTICE_ATTEMPT_SPLIT =
  /─{3,}\s*ATTEMPT (?:THE QUESTION|ALL QUESTIONS)[\s\S]*?─{3,}/i;

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
