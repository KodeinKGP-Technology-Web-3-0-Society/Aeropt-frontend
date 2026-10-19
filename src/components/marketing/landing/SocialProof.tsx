/** Facts the product can defend. No user counts or ratings until there are real ones. */
const FACTS = [
  { value: "3", label: "subjects: Physics, Chemistry, Maths", tint: "var(--physics)" },
  { value: "NCERT", label: "plus H.C. Verma and JEE papers", tint: "var(--chemistry)" },
  { value: "2014 →", label: "official JEE Advanced papers", tint: "var(--maths)" },
  { value: "Every reply", label: "checked before you see it", tint: "var(--success)" },
];

export default function SocialProof() {
  return (
    <section data-reveal className="border-y border-line bg-canvas px-5 py-8 sm:px-8">
      <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
        {FACTS.map((f) => (
          <li key={f.label} className="flex flex-col gap-1 border-l-2 pl-4" style={{ borderColor: f.tint }}>
            <span className="font-display text-2xl font-semibold tracking-tight text-ink">{f.value}</span>
            <span className="text-sm leading-snug text-ink-2">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
