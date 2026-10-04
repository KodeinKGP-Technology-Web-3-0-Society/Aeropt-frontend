/* Run: node --experimental-strip-types src/lib/plainProse.selftest.ts  (npm run test:prose) */
import { plainProse } from "./plainProse.ts";

const cases: [string, string, string][] = [
  ["clause dash", "The force is constant — so the acceleration is too.", "The force is constant, so the acceleration is too."],
  ["paired dashes", "Momentum — not energy — is conserved here.", "Momentum, not energy, is conserved here."],
  ["unspaced", "Use energy—it is faster.", "Use energy, it is faster."],
  ["dash before full stop", "That is the key idea —.", "That is the key idea."],
  ["opener removed", "Great question! The field is radial.", "The field is radial."],
  ["opener only at the start", "It was a great question! Next.", "It was a great question! Next."],
  ["maths untouched", "We get $a — b$ here — check it.", "We get $a — b$ here, check it."],
  ["display maths untouched", "$$x — y$$\nso — done", "$$x — y$$\nso, done"],
  ["code untouched", "Run `a — b` now — please.", "Run `a — b` now, please."],
  ["line-leading dash is a bullet", "Steps:\n— first\n— second", "Steps:\n- first\n- second"],
  ["phrasing", "Let's dive in and delve into torque.", "Let's start and look at torque."],
  ["no dash, unchanged", "Plain sentence with $x^2$.", "Plain sentence with $x^2$."],
];

let failed = 0;
for (const [name, input, want] of cases) {
  const got = plainProse(input);
  if (got !== want) {
    failed++;
    console.log(`FAIL  ${name}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  } else {
    console.log(`PASS  ${name}`);
  }
}
console.log(failed ? `\n${failed} failed` : `\n${cases.length} checks passed`);
if (failed) process.exit(1);
