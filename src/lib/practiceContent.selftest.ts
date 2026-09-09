/**
 *   npx --yes tsx src/lib/practiceContent.selftest.ts
 */
import { preprocessMarkdownMath } from "./markdownMath.ts";
import { extractPracticeQuestion, looksLikePracticeDump, asPracticeBatch } from "./practiceContent.ts";

const fence = `\`\`\`interactive-practice
{"type":"mcq","difficulty":"JEE_ADVANCED","question_text":"A rod of mass $m$ and length $L$.","options":[{"id":"A","latex":"$3g/2L$"},{"id":"B","latex":"$g/L$"}],"correct_answer":"A","solution_walkthrough":"1. Torque\\n$$\\\\tau = I\\\\alpha$$"}
\`\`\``;

const dumped = JSON.stringify({
  type: "mcq",
  difficulty: "JEE ADVANCED",
  question_text: "A uniform rod of mass $m$ and length $L$ is hinged at one end.",
  options: [{ id: "A", latex: "3g/2L" }],
  correct_answer: "A",
  solution_walkthrough: "1. Torque Equation\n$$\\tau = I\\alpha$$",
});

const cases: Array<{ id: string; ok: boolean; detail?: string }> = [];

function check(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail });
}

const fromFence = extractPracticeQuestion(fence);
check(
  "fence-extracts-mcq",
  fromFence.data?.type === "mcq" && Boolean(fromFence.data?.question_text.includes("rod")),
);
check("fence-hides-json-from-remainder", !fromFence.remainder.includes("question_text"));

const fromBare = extractPracticeQuestion(dumped);
check("bare-json-extracts", fromBare.data?.correct_answer === "A");

check("looks-like-dump", looksLikePracticeDump(dumped));
check("prose-not-dump", !looksLikePracticeDump("Torque is the turning effect of a force."));
check(
  "batch-coerces-question-text",
  asPracticeBatch([{ type: "mcq", question_text: "A rod.", correct_answer: "A" }]).length === 1,
);
check("batch-drops-junk", asPracticeBatch([{ hello: "world" }, null]).length === 0);

const preprocessed = preprocessMarkdownMath(fence);
check(
  "preprocess-keeps-fence",
  preprocessed.includes("```interactive-practice") && preprocessed.includes("question_text"),
);

for (const c of cases) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
}

const failed = cases.filter((c) => !c.ok);
if (failed.length) {
  process.exit(1);
}
console.log(`\n${cases.length} checks passed`);
