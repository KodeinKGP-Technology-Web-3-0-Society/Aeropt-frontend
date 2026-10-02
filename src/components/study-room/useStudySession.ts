import { useCallback, useEffect, useRef, useState } from "react";
import { AgentStreamError } from "@/lib/api/agent";
import {
  advanceStudyPhase,
  sendStudyMessage,
  startStudySession,
  stopStudyTurn,
  submitStudyChoice,
  type StudyLearnerSnapshot,
  type StudyPhase,
  type StudyPracticeQuestion,
  type StudyStartResponse,
  type StudyState,
  type StudyStatusEvent,
  type StudyMode,
  type QuestionSource,
} from "@/lib/api/study";

export type StudyMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The question this reply served, if it served one. */
  practiceQuestion?: StudyPracticeQuestion | null;
  phase?: StudyPhase;
  failed?: boolean;
  /** A message the room sent on the student's behalf (e.g. after "Skip to examples"). */
  auto?: boolean;
};

/** One line of the live activity list while a turn runs. */
/** A multiple-choice question graded from its key, kept on screen until the next one. */
export type AnsweredQuestion = {
  question: StudyPracticeQuestion;
  chosen: number[];
  key: number[];
  correct: boolean;
};

export type StudyActivity = {
  name: string;
  label: string;
  state: "running" | "done" | "error";
  count: number;
};

type StartInfo = Pick<
  StudyStartResponse,
  "resumed" | "resolved_from" | "in_syllabus" | "definition" | "alternatives" | "session_id"
>;

let idSeq = 0;
const nextId = () => `m${Date.now().toString(36)}${(idSeq++).toString(36)}`;

/** What the room says to the tutor after the student skips ahead. */
const KICKOFF: Partial<Record<StudyPhase, string>> = {
  examples: "Let's move on to the worked examples.",
  practice: "I'm ready to practise — give me a question.",
};

/**
 * Fold a status event into the activity list. Repeats of a tool (two retrievals)
 * share a line with a count; "Thinking" stays the backdrop for whatever runs inside it.
 */
function foldActivity(list: StudyActivity[], event: StudyStatusEvent): StudyActivity[] {
  const next = [...list];
  const idx = next.findIndex((a) => a.name === event.name);
  if (event.state === "start") {
    if (idx >= 0) {
      next[idx] = { ...next[idx], state: "running", count: next[idx].count + 1, label: event.label };
    } else {
      next.push({ name: event.name, label: event.label, state: "running", count: 1 });
    }
  } else if (idx >= 0) {
    next[idx] = { ...next[idx], state: event.state === "error" ? "error" : "done" };
  }
  return next;
}

export function useStudySession(
  topic: string,
  openSessionId?: string | null,
  mode: StudyMode = "learn",
  questionSource: QuestionSource = "any",
) {
  const [study, setStudy] = useState<StudyState | null>(null);
  const [learner, setLearner] = useState<StudyLearnerSnapshot | null>(null);
  const [startInfo, setStartInfo] = useState<StartInfo | null>(null);
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [activity, setActivity] = useState<StudyActivity[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [evaluation, setEvaluation] = useState<{
    summary: string | null;
    readiness: number | null;
    delta: number | null;
  } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [stopping, setStopping] = useState(false);
  /** Text handed back to the composer after Stop, with a nonce to remount it. */
  const [restored, setRestored] = useState<{ text: string; nonce: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [answered, setAnswered] = useState<AnsweredQuestion | null>(null);
  const [grading, setGrading] = useState(false);
  const forceNewRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const applyStart = useCallback((res: StudyStartResponse) => {
    const { session_id, resumed, resolved_from, in_syllabus, definition, alternatives, learner: snap, transcript, readiness_score, ...state } = res;
    setStudy(state);
    setLearner(snap);
    setStartInfo({ session_id, resumed, resolved_from, in_syllabus, definition, alternatives });
    setAnswered(null);
    setMessages(
      (transcript || []).map((t) => ({
        id: nextId(),
        role: t.role,
        content: t.content,
        practiceQuestion: t.practice_question ?? null,
      })),
    );
    // A finished session reopened from history brings its results back with it.
    const finished = state.current_phase === "completed" || state.current_phase === "evaluation";
    setEvaluation(
      finished
        ? { summary: state.evaluation_summary ?? null, readiness: readiness_score ?? null, delta: null }
        : null,
    );
  }, []);

  useEffect(() => {
    let live = true;
    const forceNew = forceNewRef.current;
    forceNewRef.current = false;
    startStudySession(topic, { forceNew, studySessionId: forceNew ? null : openSessionId, mode, questionSource })
      .then((res) => {
        if (live) applyStart(res);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setStartError(err instanceof Error ? err.message : "Could not open the study room.");
      });
    return () => {
      live = false;
    };
  }, [topic, openSessionId, mode, questionSource, reloadToken, applyStart]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (pendingQuery === null) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [pendingQuery]);

  const send = useCallback(
    async (text: string, opts: { echo?: boolean; auto?: boolean } = {}) => {
      const query = text.trim();
      if (!query || !study || !startInfo || pendingQuery !== null) return;

      setSendError(null);
      setNotice(null);
      setElapsed(0);
      setActivity([]);
      if (opts.echo !== false) {
        setMessages((prev) => [...prev, { id: nextId(), role: "user", content: query, auto: opts.auto }]);
      }
      setPendingQuery(query);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await sendStudyMessage(
          { sessionId: startInfo.session_id, studySessionId: study.study_session_id, query },
          controller.signal,
          (event) => setActivity((list) => foldActivity(list, event)),
        );
        if (res.cancelled) {
          // Stopped: the message never happened. Take it out and hand it back.
          if (res.study) setStudy(res.study);
          setMessages((prev) => {
            const copy = [...prev];
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === "user" && copy[i].content === query) {
                copy.splice(i, 1);
                break;
              }
            }
            return copy;
          });
          if (!opts.auto) setRestored({ text: query, nonce: Date.now() });
          setNotice("Stopped. Your message is back in the box — edit it or send something else.");
          return;
        }
        // A typed answer the tutor graded: keep the question on screen with its
        // result until the student asks for the next one.
        const before = study;
        const gradedNow =
          before?.practice_question &&
          !res.study.practice_question &&
          res.study.questions_served > before.questions_served;
        setStudy(res.study);
        if (res.study.practice_question) setAnswered(null);
        else if (gradedNow && before?.practice_question) {
          setAnswered({
            question: before.practice_question,
            chosen: [],
            key: [],
            correct: res.study.questions_correct > before.questions_correct,
          });
        }
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: res.response,
            practiceQuestion: res.practice_question ?? null,
            phase: res.study.current_phase,
          },
        ]);
        if (res.evaluation_summary || res.readiness_score != null) {
          setEvaluation({
            summary: res.evaluation_summary ?? null,
            readiness: res.readiness_score ?? null,
            delta: res.readiness_delta ?? null,
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof AgentStreamError || err instanceof Error
            ? err.message
            : "Something went wrong. Try again.";
        setSendError(message);
        // Keep the student's message on screen, marked, so Retry resends it.
        setMessages((prev) => {
          const copy = [...prev];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "user" && copy[i].content === query) {
              copy[i] = { ...copy[i], failed: true };
              break;
            }
          }
          return copy;
        });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setPendingQuery(null);
        setActivity([]);
        setStopping(false);
      }
    },
    [study, startInfo, pendingQuery],
  );

  /**
   * Skip ahead / finish, decided by the student rather than the model: the server
   * moves the phase, then the tutor is asked to open the new phase.
   */
  /**
   * Submit a multiple-choice pick. Graded from the stored key with no model call;
   * a right answer just shows ✓ (the solution is one click away), a wrong one
   * shows the correct option and asks the tutor to explain it. Questions without
   * a readable key go to the tutor as a normal answer.
   */
  const answerChoice = useCallback(
    async (labels: string[], question: StudyPracticeQuestion, positionOf: (label: string) => number) => {
      if (!study || pendingQuery !== null || grading || !labels.length) return;
      const shown = labels.map((l) => `(${l})`).join(", ");
      setGrading(true);
      setSendError(null);
      setNotice(null);
      try {
        const res = await submitStudyChoice(study.study_session_id, labels);
        if (!res.graded) {
          setGrading(false);
          await send(`My answer: ${shown}`);
          return;
        }
        setStudy(res.study);
        setAnswered({ question, chosen: labels.map(positionOf), key: res.key, correct: res.correct });
        const keyLabel = (n: number) => {
          const style = labels[0] ?? "1";
          return /[A-D]/.test(style) ? "ABCD"[n - 1] : /[a-d]/.test(style) ? "abcd"[n - 1] : String(n);
        };
        const keyShown = res.key.map((n) => `(${keyLabel(n)})`).join(", ");
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "user", content: `My answer: ${shown}` },
          {
            id: nextId(),
            role: "assistant",
            content: res.correct ? `✓ **Correct** — the answer is ${keyShown}.` : `✗ **Not quite** — you chose ${shown}; the answer is ${keyShown}.`,
          },
        ]);
        setGrading(false);
        if (!res.correct) {
          await send(`I chose ${shown} but the answer is ${keyShown}. Please walk me through the correct solution.`, { auto: true });
        }
      } catch (err) {
        setGrading(false);
        setSendError(err instanceof Error ? err.message : "Could not check that answer. Try again.");
      }
    },
    [study, pendingQuery, grading, send],
  );

  const advance = useCallback(async () => {
    if (!study || pendingQuery !== null || advancing) return;
    setAdvancing(true);
    setSendError(null);
    try {
      const res = await advanceStudyPhase(study.study_session_id);
      setStudy(res.study);
      if (res.evaluation_summary || res.readiness_score != null) {
        setEvaluation({
          summary: res.evaluation_summary ?? null,
          readiness: res.readiness_score ?? null,
          delta: res.readiness_delta ?? null,
        });
      }
      const kickoff = KICKOFF[res.study.current_phase];
      setAdvancing(false);
      if (kickoff) await send(kickoff, { auto: true });
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not move on. Try again.");
      setAdvancing(false);
    }
  }, [study, pendingQuery, advancing, send]);

  /**
   * Stop the running turn. The server ends it at its next step and saves
   * nothing; the stream then returns `cancelled` and the message comes back to
   * the composer. If the server cannot be reached, abort locally after 8 s.
   */
  const stop = useCallback(() => {
    if (!study || pendingQuery === null || stopping) return;
    setStopping(true);
    void stopStudyTurn(study.study_session_id);
    const query = pendingQuery;
    const controller = abortRef.current; // only ever abort THIS turn, not a later one
    window.setTimeout(() => {
      if (controller && abortRef.current === controller) {
        controller.abort();
        setMessages((prev) => prev.filter((m, i) => !(i === prev.length - 1 && m.role === "user" && m.content === query)));
        setRestored({ text: query, nonce: Date.now() });
        setNotice("Stopped.");
      }
    }, 8000);
  }, [study, pendingQuery, stopping]);

  const retry = useCallback(() => {
    const failed = [...messages].reverse().find((m) => m.role === "user" && m.failed);
    if (!failed) return;
    setMessages((prev) => prev.map((m) => (m.id === failed.id ? { ...m, failed: false } : m)));
    void send(failed.content, { echo: false });
  }, [messages, send]);

  const restart = useCallback(() => {
    abortRef.current?.abort();
    forceNewRef.current = true;
    setStartError(null);
    setStudy(null);
    setMessages([]);
    setReloadToken((n) => n + 1);
  }, []);

  const reload = useCallback(() => {
    setStartError(null);
    setReloadToken((n) => n + 1);
  }, []);

  return {
    study,
    learner,
    startInfo,
    messages,
    startError,
    sendError,
    busy: pendingQuery !== null || advancing || grading,
    grading,
    answered,
    answerChoice,
    advancing,
    stopping,
    restored,
    notice,
    stop,
    activity,
    elapsed,
    evaluation,
    send,
    advance,
    retry,
    restart,
    reload,
  };
}
