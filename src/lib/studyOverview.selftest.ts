/**
 *   node --experimental-strip-types src/lib/studyOverview.selftest.ts
 */
import {
  isExploredConcept,
  splitInProgressAndExplored,
  flattenAndSortConcepts,
  getDefaultActiveTab,
  calculateSyllabusStats,
  conceptAction,
  conceptHref,
  type TabCounts,
} from "./studyOverview.ts";
import type { OverviewConcept, OverviewGroup, SyllabusUnit } from "./api/study.ts";

const cases: Array<{ id: string; ok: boolean; detail?: string }> = [];

function check(id: string, ok: boolean, detail?: string) {
  cases.push({ id, ok, detail });
}

// ── Shape A: Brand-new account ───────────────────────────────────────────────
const brandNewCounts: TabCounts = {
  needs_review: 0,
  in_progress: 0,
  explored: 0,
  mastered: 0,
};
const brandNewSplit = splitInProgressAndExplored([]);
check(
  "brand-new-empty-split",
  brandNewSplit.inProgressCount === 0 && brandNewSplit.exploredCount === 0,
);
check(
  "brand-new-default-tab",
  getDefaultActiveTab(brandNewCounts) === "in_progress",
);
const emptySyllabusStats = calculateSyllabusStats([]);
check(
  "brand-new-syllabus-stats",
  emptySyllabusStats.totalTopics === 0 && emptySyllabusStats.startedPct === 0,
);

// ── Shape B: 1-3 topics (early student) ──────────────────────────────────────
const earlyConcepts: OverviewConcept[] = [
  {
    concept_id: "kinematics_1d",
    name: "Kinematics in 1D",
    chapter: "Motion in a Straight Line",
    chapter_id: "ch_motion_1d",
    proficiency: 0.45,
    attempts: 4,
    correct: 2,
    phase: "practice",
    study_session_id: "sess_1",
    last_practised: "2026-10-18T10:00:00Z",
  },
  {
    concept_id: "vectors_intro",
    name: "Vectors",
    chapter: "Mathematical Tools",
    chapter_id: "ch_math_tools",
    proficiency: 0.8,
    attempts: 6,
    correct: 5,
    phase: null,
    last_practised: "2026-10-17T12:00:00Z",
  },
];
const earlyGroups: OverviewGroup[] = [
  {
    chapter: "Motion in a Straight Line",
    chapter_id: "ch_motion_1d",
    concepts: [earlyConcepts[0]],
  },
  {
    chapter: "Mathematical Tools",
    chapter_id: "ch_math_tools",
    concepts: [earlyConcepts[1]],
  },
];

const earlySplit = splitInProgressAndExplored(earlyGroups);
check(
  "early-split-counts",
  earlySplit.inProgressCount === 2 && earlySplit.exploredCount === 0,
  `Got inProgress: ${earlySplit.inProgressCount}, explored: ${earlySplit.exploredCount}`,
);
const earlyCounts: TabCounts = {
  needs_review: 0,
  in_progress: earlySplit.inProgressCount,
  explored: earlySplit.exploredCount,
  mastered: 0,
};
check(
  "early-default-tab-is-in-progress",
  getDefaultActiveTab(earlyCounts) === "in_progress",
);

// ── Shape C: 18+ chapters in progress, mostly chat explored ──────────────────
const chatExploredConcepts: OverviewConcept[] = Array.from({ length: 20 }, (_, i) => ({
  concept_id: `topic_${i}`,
  name: `Topic ${i}`,
  chapter: `Chapter ${Math.floor(i / 2)}`,
  chapter_id: `ch_${Math.floor(i / 2)}`,
  attempts: 0,
  phase: null,
  last_practised: `2026-10-${String((i % 18) + 1).padStart(2, "0")}T08:00:00Z`,
}));

// Add 2 active concepts
chatExploredConcepts.push({
  concept_id: "rotational_torque",
  name: "Torque",
  chapter: "Rotational Motion",
  chapter_id: "ch_rotation",
  attempts: 5,
  correct: 3,
  phase: "practice",
  study_session_id: "sess_rot",
  last_practised: "2026-10-18T14:00:00Z",
});

const shapeCGroups: OverviewGroup[] = [
  {
    chapter: "Various Chapters",
    chapter_id: "ch_various",
    concepts: chatExploredConcepts,
  },
];

const shapeCSplit = splitInProgressAndExplored(shapeCGroups);
check(
  "shape-c-isolates-explored",
  shapeCSplit.exploredCount === 20 && shapeCSplit.inProgressCount === 1,
  `inProgress: ${shapeCSplit.inProgressCount}, explored: ${shapeCSplit.exploredCount}`,
);
check(
  "shape-c-is-explored-helper",
  isExploredConcept(chatExploredConcepts[0]) && !isExploredConcept(chatExploredConcepts[20]),
);

// If in_progress is 0 and explored is 20, default tab should be explored
const onlyChatCounts: TabCounts = {
  needs_review: 0,
  in_progress: 0,
  explored: 20,
  mastered: 0,
};
check(
  "only-chat-defaults-to-explored",
  getDefaultActiveTab(onlyChatCounts) === "explored",
);

// ── Shape D: Heavy user with all tabs full ────────────────────────────────────
const heavyReviewGroups: OverviewGroup[] = [
  {
    chapter: "Electrostatics",
    chapter_id: "ch_electrostatics",
    concepts: [
      {
        concept_id: "gauss_law",
        name: "Gauss's Law",
        chapter: "Electrostatics",
        chapter_id: "ch_electrostatics",
        proficiency: 0.35,
        overdue: false,
        last_practised: "2026-10-10T12:00:00Z",
      },
      {
        concept_id: "coulombs_law",
        name: "Coulomb's Law",
        chapter: "Electrostatics",
        chapter_id: "ch_electrostatics",
        proficiency: 0.55,
        overdue: true, // Overdue must sort ahead of Gauss's Law despite higher proficiency
        last_practised: "2026-10-12T12:00:00Z",
      },
    ],
  },
];

const sortedReview = flattenAndSortConcepts(heavyReviewGroups, "review");
check(
  "review-sorts-overdue-first",
  sortedReview[0].concept_id === "coulombs_law",
  `First was: ${sortedReview[0]?.concept_id}`,
);

const heavyCounts: TabCounts = {
  needs_review: 5,
  in_progress: 10,
  explored: 15,
  mastered: 25,
};
check(
  "heavy-user-defaults-to-review",
  getDefaultActiveTab(heavyCounts) === "review",
);

// Check conceptAction and conceptHref
const overdueAction = conceptAction(sortedReview[0], "review");
check("concept-action-review", overdueAction.tone === "danger" && overdueAction.label === "Review");

const resumeAction = conceptAction(earlyConcepts[0], "in_progress");
check("concept-action-resume", resumeAction.tone === "warning" && resumeAction.label === "Resume");

check(
  "concept-href-with-session",
  conceptHref(earlyConcepts[0]) === "/study/kinematics_1d?session=sess_1",
);

// Check syllabus calculations
const sampleSyllabus: SyllabusUnit[] = [
  {
    unit: "Physics and Measurement",
    total: 10,
    started: 6,
    mastered: 4,
    topics: [],
  },
  {
    unit: "Kinematics",
    total: 20,
    started: 14,
    mastered: 10,
    topics: [],
  },
];
const stats = calculateSyllabusStats(sampleSyllabus);
check("syllabus-total-calc", stats.totalTopics === 30 && stats.totalStarted === 20 && stats.totalMastered === 14);
check("syllabus-pct-calc", stats.startedPct === 67 && stats.masteredPct === 47);

// ── Output results ───────────────────────────────────────────────────────────
for (const c of cases) {
  console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.id}${c.detail ? ` — ${c.detail}` : ""}`);
}

const failed = cases.filter((c) => !c.ok);
if (failed.length) {
  console.error(`\n${failed.length} checks failed!`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} studyOverview checks passed.`);
