/**
 * End-to-end proof: run fixtures through the *actual* markdown pipeline the chat view
 * uses (remark-math → rehype-katex → HTML) and count error nodes in the output.
 *
 *   node scripts/render-check.mjs fixtures/latex-corpus.json
 *
 * `katex-audit.mjs` approximates remark-math's span splitting with regexes; this script
 * removes that approximation by using the real plugins, so a pass here means the page
 * really renders. It is the slower of the two, which is why the fast one is the CI gate.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ROOT = path.resolve(import.meta.dirname, "..");

const { unified } = await import("unified");
const remarkParse = (await import("remark-parse")).default;
const remarkGfm = (await import("remark-gfm")).default;
const remarkMath = (await import("remark-math")).default;
const remarkRehype = (await import("remark-rehype")).default;
const rehypeKatex = (await import("rehype-katex")).default;

async function transpile(relPath, outName) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const out = ts
    .transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText.replace(/from "katex"/g, `from "${require.resolve("katex")}"`)
    .replace(
      /from "\.\/markdownMath"/g,
      `from "${path.join(ROOT, "node_modules/.cache/markdownMath.render.mjs")}"`,
    );
  const tmp = path.join(ROOT, "node_modules/.cache", outName);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, out);
  return import(`file://${tmp}?v=${Date.now()}`);
}

await transpile("src/lib/math/markdownMath.ts", "markdownMath.render.mjs");
const { prepareMathMarkdown } = await transpile("src/lib/math/mathHarden.ts", "mathHarden.render.mjs");
const rehypeKatexSafe = (await transpile("src/lib/math/rehypeKatexSafe.ts", "rehypeKatexSafe.render.mjs"))
  .default;

// Same options as KATEX_OPTIONS in src/components/MarkdownMath.tsx. The tree is
// inspected directly rather than stringified, so no extra dependency is needed.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkRehype)
  .use(rehypeKatex, { throwOnError: false, strict: "ignore", trust: true, output: "htmlAndMathml" })
  .use(rehypeKatexSafe);

function classesOf(node) {
  const value = node.properties?.className;
  if (!value) return [];
  return Array.isArray(value) ? value : String(value).split(/\s+/);
}

/** Walk the rendered tree: KaTeX nodes, error nodes, and text outside code. */
function inspect(tree) {
  let maths = 0;
  let errors = 0;
  let text = "";
  const visit = (node, insideCode) => {
    const inCode = insideCode || node.tagName === "code" || node.tagName === "pre";
    if (node.type === "element") {
      const classes = classesOf(node);
      if (classes.includes("katex-error")) errors++;
      else if (classes.includes("katex")) maths++;
    }
    if (node.type === "text" && !insideCode) text += node.value;
    for (const child of node.children ?? []) visit(child, inCode);
  };
  visit(tree, false);
  return { maths, errors, text };
}

const file = process.argv[2] ?? "fixtures/latex-agent-output.json";
// Hard gate: a red error node in front of a student is never acceptable.
// Soft gate: a literal `$` can legitimately survive when the input has nothing to
// render (`$ $`) or deliberately escapes a delimiter, so a small allowance is kept.
const strayFlag = process.argv.indexOf("--max-stray");
const maxStray = strayFlag === -1 ? 4 : Number(process.argv[strayFlag + 1] ?? 4);
const records = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));

let rendered = 0;
let errorNodes = 0;
let mathNodes = 0;
let strayDollars = 0;
const offenders = [];

for (const record of records) {
  const source = record.text ?? record.stored ?? "";
  if (!source.trim()) continue;
  const prepared = prepareMathMarkdown(source, "full");
  const tree = await processor.run(processor.parse(prepared));
  rendered++;
  const { maths, errors, text } = inspect(tree);
  // A `$` surviving into the rendered *text* means a delimiter never paired. An
  // escaped `\$` renders as a literal `$` on purpose, so those are expected; count
  // only as many as the source deliberately escaped.
  const intended = (prepared.match(/\\\$/g) || []).length;
  const leftover = Math.max(0, (text.match(/\$/g) || []).length - intended);
  errorNodes += errors;
  mathNodes += maths;
  strayDollars += leftover;
  if (errors > 0 || leftover > 0) {
    offenders.push({ id: record.id, errors, leftover });
  }
}

console.log(
  `render-check: ${rendered} documents, ${mathNodes} rendered formulas, ` +
    `${errorNodes} katex-error node(s), ${strayDollars} stray delimiter(s)`,
);
for (const offender of offenders.slice(0, 10)) {
  console.log(`  ${offender.id}: errors=${offender.errors} stray=${offender.leftover}`);
}
if (errorNodes > 0) {
  console.error(`FAIL: ${errorNodes} KaTeX error node(s) would be visible to a student`);
  process.exit(1);
}
if (strayDollars > maxStray) {
  console.error(`FAIL: ${strayDollars} stray delimiter(s) exceeds --max-stray ${maxStray}`);
  process.exit(1);
}
console.log("OK");
