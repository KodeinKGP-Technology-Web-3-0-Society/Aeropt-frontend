/**
 * Phase 4 — run frontend LaTeX golden fixtures.
 *
 *   npx --yes tsx src/lib/markdownMath.selftest.ts
 */
import {
  assertMathFixtures,
  MATH_GOLDEN_FIXTURES,
  type MathFixture,
} from "./markdownMath.ts";

const ONBOARDING_MATH_FIXTURES: MathFixture[] = [
  {
    id: "onboarding-inline-vector-notation",
    surface: "chat",
    input:
      "A block of mass $m$ on a frictionless surface. Which law gives $\\vec{F} = m\\vec{a}$?",
    mustInclude: ["\\vec{F}", "\\vec{a}"],
  },
  {
    id: "onboarding-nu-not-newline",
    surface: "chat",
    input:
      "The kinematic viscosity is \\nu = \\mu/\\rho. The macro \\nu must not become a line break.",
    mustInclude: ["\\nu", "\\mu", "\\rho", "must not become a line break"],
    mustNotInclude: ["u = \\mu/\\rho", "viscosity is u"],
  },
];

const results = assertMathFixtures([
  ...MATH_GOLDEN_FIXTURES,
  ...ONBOARDING_MATH_FIXTURES,
]);
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
