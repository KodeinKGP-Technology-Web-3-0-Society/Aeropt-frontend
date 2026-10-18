import Link from "next/link";
import type { QuestionSource, StudyLearnerSnapshot, StudyMode, StudyPrerequisite, StudyStartResponse } from "@/lib/api/study";

type Alt = StudyStartResponse["alternatives"][number];

function prereqStatus(p: StudyPrerequisite): { label: string; tone: string } {
  if (p.studied?.outcome === "mastered" || (p.proficiency ?? 0) >= 0.7) {
    return { label: "Solid", tone: "bg-success/12 text-success" };
  }
  if (p.studied || p.proficiency != null) {
    return { label: "Shaky", tone: "bg-warning/15 text-ink-2" };
  }
  return { label: "New", tone: "bg-hover text-muted" };
}

function outcomeText(outcome?: string | null, phase?: string | null): string {
  if (outcome === "mastered") return "mastered";
  if (outcome === "needs_review") return "needs review";
  if (phase) return `stopped in ${phase}`;
  return "unfinished";
}

/** What the tutor already knows, in the student's terms. */
function KnownAboutYou({ learner }: { learner: StudyLearnerSnapshot }) {
  const prior = learner.prior_sessions[0];
  const hasAnything =
    learner.prior_sessions.length > 0 ||
    learner.prerequisites.length > 0 ||
    learner.related_sessions.length > 0 ||
    learner.memories.length > 0;
  if (!hasAnything) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="known-heading">
      <h2 id="known-heading" className="text-[11px] font-bold uppercase tracking-widest text-muted">
        What your tutor already knows
      </h2>
      <ul className="mt-4 flex flex-col gap-3 text-sm text-ink-2">
        {prior && (
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>
              You studied this {prior.when}: {prior.questions_served
                ? `${prior.questions_correct}/${prior.questions_served} correct`
                : "no practice answered"}, {outcomeText(prior.outcome, prior.phase)}.
              {learner.recommended_difficulty
                ? ` Practice will start around difficulty ${learner.recommended_difficulty}.`
                : " The lesson will be a short recap."}
            </span>
          </li>
        )}
        {learner.related_sessions.slice(0, 2).map((s) => (
          <li key={`${s.concept_id}-${s.when}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2/40" aria-hidden />
            <span>
              You worked on <span className="font-semibold text-ink">{s.concept_name}</span> in this chapter {s.when}
              {s.questions_served ? ` (${s.questions_correct}/${s.questions_served})` : ""}. The tutor will connect to it.
            </span>
          </li>
        ))}
        {learner.memories.slice(0, 3).map((m, i) => (
          <li key={`mem-${i}`} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2/40" aria-hidden />
            <span>{m.fact}</span>
          </li>
        ))}
      </ul>

      {learner.prerequisites.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-ink-2">Builds on</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {learner.prerequisites.map((p) => {
              const status = prereqStatus(p);
              return (
                <li
                  key={p.concept_id}
                  className="flex items-center gap-1.5 rounded-full border border-line py-1 pl-3 pr-1 text-xs text-ink"
                >
                  {p.concept_name}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.tone}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export default function StudyWelcome({
  conceptName,
  chapter,
  definition,
  resolvedFrom,
  inSyllabus,
  alternatives,
  learner,
  busy,
  onStart,
  mode = "learn",
  questionSource = "any",
  modeHref,
}: {
  conceptName: string;
  chapter?: string | null;
  definition?: string | null;
  resolvedFrom?: string;
  inSyllabus: boolean;
  alternatives: Alt[];
  learner: StudyLearnerSnapshot | null;
  busy: boolean;
  onStart: () => void;
  mode?: StudyMode;
  questionSource?: QuestionSource;
  /** URL for this topic in another mode / question source. */
  modeHref: (mode: StudyMode, source?: QuestionSource) => string;
}) {
  const practice = mode === "practice";
  const typedSomethingElse =
    resolvedFrom && resolvedFrom.trim().toLowerCase() !== conceptName.trim().toLowerCase();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 py-6">
      <header>
        {chapter && <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{chapter}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{conceptName}</h1>
        {definition && <p className="mt-2 text-sm leading-relaxed text-ink-2 first-letter:uppercase">{definition}.</p>}
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {practice
            ? "Practice only, no lesson. Calibrated questions one at a time, difficulty adjusting as you go. Stuck? Ask for a hint, ask what the question means, or ask about the concept behind it."
            : "A guided session in four steps: learn the idea, walk through worked examples, practise calibrated questions, then see your results. Go at your pace and ask anything along the way."}
        </p>
      </header>

      {!inSyllabus && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-ink-2">
          This topic sits outside the JEE syllabus your tutor covers, so the material may be thin.
        </p>
      )}

      {typedSomethingElse && alternatives.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-sm text-ink-2">
            You searched for <span className="font-semibold text-ink">“{resolvedFrom}”</span>. Not what you meant?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.concept_id}
                href={`/study/${encodeURIComponent(alt.concept_id)}`}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink"
              >
                {alt.concept_name}
                {alt.chapter ? <span className="text-muted"> · {alt.chapter}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      )}

      {learner && <KnownAboutYou learner={learner} />}

      {practice && (
        <fieldset className="rounded-2xl border border-line bg-surface px-5 py-4">
          <legend className="sr-only">Question source</legend>
          <p className="text-xs font-semibold text-ink-2">Questions from</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              { key: "any", label: "All questions", sub: "textbook + past papers" },
              { key: "pyq", label: "Past JEE papers only", sub: "PYQs" },
            ] as const).map((o) => (
              <Link
                key={o.key}
                href={modeHref("practice", o.key)}
                aria-current={questionSource === o.key ? "true" : undefined}
                className={`rounded-xl border px-3.5 py-2 text-left transition-colors ${
                  questionSource === o.key ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-2 hover:border-accent"
                }`}
              >
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block text-[11px] text-muted">{o.sub}</span>
              </Link>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {practice ? "Start practising" : learner?.returning ? "Start the recap" : "Start the lesson"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
        {practice ? (
          <Link href={modeHref("learn")} className="rounded-xl px-3 py-3 text-sm font-medium text-ink-2 hover:text-ink">
            Learn it first instead
          </Link>
        ) : (
          <Link href={modeHref("practice")} className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-hover">
            Just practise questions
          </Link>
        )}
      </div>
    </div>
  );
}
