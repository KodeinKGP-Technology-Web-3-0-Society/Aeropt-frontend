/**
 * Phase 4 — run frontend LaTeX golden fixtures.
 *
 *   npx --yes tsx src/lib/markdownMath.selftest.ts
 */
import { assertMathFixtures } from "./markdownMath.ts";

const results = assertMathFixtures();
const failed = results.filter((r) => !r.ok);

for (const r of results) {
  const mark = r.ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${r.id}${r.detail ? ` — ${r.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\n${failed.length}/${results.length} fixture(s) failed`);
  process.exit(1);
}

console.log(`\n${results.length} fixtures ok`);
