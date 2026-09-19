/**
 * Render text through the real chat pipeline (preprocessMarkdownMath + KaTeX) and
 * report anything that would not render.
 *
 *   node scripts/katex-audit.mjs fixtures/latex-corpus.json        # audit a corpus dump
 *   node scripts/katex-audit.mjs fixtures/latex-corpus.json --max 0  # fail on any breakage
 *
 * Input is a JSON array of {id, text} (or {id, raw}/{id, agent}) records — the agent
 * writes one with `make latex-fixture`. Exit code is non-zero when breakages exceed
 * `--max`, so this works as a CI gate rather than only as a report.
 *
 * Why render for real: brace counting and regex checks agree with KaTeX right up to
 * the cases that matter (`\left\{`, `\begin{matrix}`, `\text{}` with odd contents).
 * The only trustworthy oracle is KaTeX itself.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const katex = require("katex");
const ts = require("typescript");

const ROOT = path.resolve(import.meta.dirname, "..");
const SENTINEL = String.fromCharCode(1);

async function transpile(relPath, outName) {
  const src = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const out = ts
    .transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    })
    .outputText
    .replace(/from "katex"/g, `from "${require.resolve("katex")}"`)
    .replace(/from "\.\/markdownMath"/g, `from "${path.join(ROOT, "node_modules/.cache/markdownMath.audit.mjs")}"`);
  const tmp = path.join(ROOT, "node_modules/.cache", outName);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, out);
  return import(`file://${tmp}?v=${Date.now()}`);
}

/** The exact pipeline the chat view runs: preprocess, then KaTeX-veto each span. */
async function loadPreprocessor() {
  await transpile("src/lib/math/markdownMath.ts", "markdownMath.audit.mjs");
  const { prepareMathMarkdown } = await transpile("src/lib/math/mathHarden.ts", "mathHarden.audit.mjs");
  return { preprocessMarkdownMath: (text) => prepareMathMarkdown(text, "full") };
}

const CODE_RE = /```[\s\S]*?```|`[^`\n]*`/g;

/** Split out math spans the way remark-math does: code masked, display, then inline. */
export function mathSpans(text) {
  const spans = [];
  const withoutCode = text.replace(CODE_RE, (whole) => " ".repeat(Math.min(whole.length, 3)));
  const afterDisplay = withoutCode.replace(/\$\$([\s\S]+?)\$\$/g, (_, body) => {
    spans.push({ mode: "display", body });
    return SENTINEL;
  });
  afterDisplay.replace(/(?<!\\)(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, body) => {
    // A span containing the display placeholder means the document's delimiters are
    // mispaired; that is reported once as unbalanced-dollar, not again per span.
    if (!body.includes(SENTINEL)) spans.push({ mode: "inline", body });
    return "";
  });
  return spans;
}

export function auditText(text, preprocess) {
  const processed = preprocess(text ?? "");
  const problems = [];

  // An odd count leaks a raw `$` into the page and can swallow following prose.
  const dollars = (processed.replace(CODE_RE, "").match(/(?<!\\)\$/g) || []).length;
  if (dollars % 2 === 1) {
    problems.push({ kind: "unbalanced-dollar", body: processed.slice(0, 160) });
  }

  for (const span of mathSpans(processed)) {
    try {
      katex.renderToString(span.body, {
        throwOnError: true,
        strict: "ignore",
        trust: true,
        displayMode: span.mode === "display",
      });
    } catch (err) {
      problems.push({
        kind: String(err.message).replace(/ at position \d+.*/, "").slice(0, 90),
        body: span.body.slice(0, 130),
      });
    }
  }
  return { processed, problems, spans: mathSpans(processed).length };
}

async function main() {
  const [file, ...rest] = process.argv.slice(2);
  if (!file) {
    console.error("usage: node scripts/katex-audit.mjs <fixture.json> [--max N] [--field name]");
    process.exit(2);
  }
  const maxFlag = rest.indexOf("--max");
  const maxAllowed = maxFlag === -1 ? 0 : Number(rest[maxFlag + 1] ?? 0);
  const fieldFlag = rest.indexOf("--field");
  const field = fieldFlag === -1 ? null : rest[fieldFlag + 1];

  const { preprocessMarkdownMath } = await loadPreprocessor();
  const records = JSON.parse(fs.readFileSync(file, "utf8"));
  const byKind = new Map();
  let spans = 0;
  let broken = 0;

  for (const record of records) {
    const text = field ? record[field] : (record.text ?? record.agent ?? record.raw ?? "");
    const { problems, spans: n } = auditText(text, preprocessMarkdownMath);
    spans += n;
    for (const problem of problems) {
      broken++;
      if (!byKind.has(problem.kind)) byKind.set(problem.kind, []);
      byKind.get(problem.kind).push({ id: record.id, body: problem.body });
    }
  }

  console.log(
    `katex-audit: ${records.length} records, ${spans} math spans, ${broken} problem(s)`,
  );
  for (const [kind, items] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  ${String(items.length).padStart(5)}  ${kind}`);
    for (const item of items.slice(0, 4)) {
      console.log(`         ${item.id ?? "?"}  ${JSON.stringify(item.body)}`);
    }
  }
  if (broken > maxAllowed) {
    console.error(`\nFAIL: ${broken} problem(s) exceeds --max ${maxAllowed}`);
    process.exit(1);
  }
  console.log("\nOK");
}

if (import.meta.filename === process.argv[1]) {
  await main();
}
