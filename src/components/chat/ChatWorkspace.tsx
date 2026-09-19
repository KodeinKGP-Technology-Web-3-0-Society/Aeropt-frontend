"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StudySidebar from "@/components/study/StudySidebar";
import AgentRosterPanel from "@/components/chat/AgentRosterPanel";
import { StudyStepBar } from "@/components/study/StudySessionCards";
import InteractivePracticeCanvas from "@/components/practice/InteractivePracticeCanvas";
import PracticeBatchCanvas from "@/components/practice/PracticeBatchCanvas";
import { getSupabaseUserId } from "@/lib/api/auth";
import { stagePrompt, updateRoadmapProgress, clearRoadmapSessionBind, writeRoadmapSessionBind } from "@/lib/api/roadmap";
import { asPracticeBatch, asPracticeData, extractPracticeQuestion } from "@/lib/practiceContent";
import type { StudyStage } from "@/lib/api/roadmap";
import type { AgentChatResponse } from "@/lib/api/agent";
import { AgentStreamError } from "@/lib/api/agent";
import ErrorBoundary from "@/components/ErrorBoundary";

import { useRoadmapBinding } from "./useRoadmapBinding";
import { useChatSession } from "./useChatSession";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import type { FlashcardItem } from "@/lib/api/agent";

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M4 6h16M4 12h10M4 18h16" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M5 5h14v14H5V5Zm10 0v14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

const fallbackPrompts = [
  "Explain torque and moment of inertia",
  "Give me a practice question on Newton's 2nd law",
];

function ChatWorkspaceInner({ sessionId }: { sessionId: string }) {
  const roadmap = useRoadmapBinding(sessionId, sessionId);
  
  const chat = useChatSession(
    sessionId,
    roadmap.roadmapNodeId,
    roadmap.roadmapConceptId,
    roadmap.isRoadmapSession,
    roadmap.startFreshRef,
    roadmap.setCurrentStageIndex,
    roadmap.setRoadmapBindReady,
    clearRoadmapSessionBind,
    writeRoadmapSessionBind,
    roadmap.initialStage,
    roadmap.entryNonce
  );

  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(false);
  const [agentRefreshKey, setAgentRefreshKey] = useState(0);
  /**
   * A turn whose stream died before the agent's `result` frame. Kept so the
   * student's question and any partial answer stay on screen with a retry,
   * instead of both being deleted (the old behaviour) or the UI spinning
   * forever.
   */
  const [failedTurn, setFailedTurn] = useState<{
    query: string;
    gradedOutcome?: "correct" | "incorrect";
    studyStage?: StudyStage;
    flaggedStepId?: string;
    messageIds: string[];
  } | null>(null);

  const [canvasPractice, setCanvasPractice] = useState<{
    data: any;
    remainder: string;
    messageId: string;
  } | null>(null);
  const [batchCanvasPractice, setBatchCanvasPractice] = useState<{
    batch: any[];
    messageId: string;
  } | null>(null);

  useEffect(() => {
    if (chat.messages.length === 0) {
      setCanvasPractice(null);
      setBatchCanvasPractice(null);
    }
  }, [chat.messages.length]);

  useEffect(() => {
    if (!chat.latestAssistant) return;
    if (asPracticeBatch(chat.latestAssistant.agent?.practice_batch).length > 1) return;
    const extracted = extractPracticeQuestion(chat.latestAssistant.content);
    const data = asPracticeData(chat.latestAssistant.agent?.practice_question) ?? extracted.data;
    if (!data) return;
    setCanvasPractice({
      data,
      remainder: extracted.remainder,
      messageId: chat.latestAssistant.id,
    });
  }, [chat.latestAssistant]);

  useEffect(() => {
    if (typeof chat.latestAssistant?.agent?.proficiency_pct === "number") {
      roadmap.setLastProficiencyPct(chat.latestAssistant.agent.proficiency_pct);
    }
  }, [chat.latestAssistant]);

  const quickPrompts = useMemo(() => {
    if (chat.latestAssistant?.agent?.flashcards?.mode === "picker") return [];
    const fromBackend = chat.latestAssistant?.structured_response?.try_next?.filter(Boolean);
    const raw = fromBackend && fromBackend.length > 0 ? fromBackend : fallbackPrompts;
    const seen = new Set<string>();
    return raw.filter((prompt) => {
      const key = prompt.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [chat.latestAssistant]);

  const completeConcept = useCallback(async (proficiencyPct?: number | null) => {
    if (!roadmap.roadmapNodeId || roadmap.conceptComplete) return;
    try {
      await updateRoadmapProgress({
        node_id: roadmap.roadmapNodeId,
        status: "completed",
        proficiency_pct: proficiencyPct ?? roadmap.lastProficiencyPct ?? undefined,
      });
      roadmap.setConceptComplete(true);
    } catch (caught) {
      chat.setError(caught instanceof Error ? caught.message : "Could not update roadmap progress.");
    }
  }, [roadmap.roadmapNodeId, roadmap.conceptComplete, roadmap.lastProficiencyPct]);

  async function handleAgentResponse(agentResponse: AgentChatResponse) {
    if (agentResponse.error) {
      throw new Error(agentResponse.error);
    }
    chat.registerSession(agentResponse.session_id);
    chat.setAwaitingGrade(Boolean(agentResponse.grading_ui?.show_correct_incorrect));
    if (typeof agentResponse.proficiency_pct === "number") {
      roadmap.setLastProficiencyPct(agentResponse.proficiency_pct);
    }
    if (agentResponse.active_agent) {
      chat.setLastActiveAgent(agentResponse.active_agent);
    }
    setAgentRefreshKey((k) => k + 1);
    
    // We expect the hook's sendAgentMessage to handle adding the final message to state
    // but the original code did it here. Let's do it here.
    return agentResponse;
  }

  async function submitMessage(
    value: string,
    gradedOutcome?: "correct" | "incorrect",
    studyStage?: StudyStage,
  ): Promise<AgentChatResponse | null> {
    const trimmed = value.trim();
    const isGradeTap = Boolean(gradedOutcome);
    if ((!trimmed && !isGradeTap) || chat.isReplying) return null;

    const display = isGradeTap ? (gradedOutcome === "correct" ? "Correct" : "Incorrect") : trimmed;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: display,
    };

    chat.setError("");
    setFailedTurn(null);
    chat.setIsReplying(true);
    const assistantId = crypto.randomUUID();
    chat.setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant" as const, content: "" },
    ]);

    try {
      const agentResponse = await chat.sendAgentMessage(
        isGradeTap ? (gradedOutcome === "correct" ? "1" : "0") : trimmed,
        chat.activeSessionId ?? sessionId,
        {
          gradedOutcome,
          studyStage,
        },
        (token) => {
          chat.setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      );
      
      chat.setMessages((current) => current.filter((m) => m.id !== assistantId));
      
      const newResponse = await handleAgentResponse(agentResponse);
      const text = newResponse.response?.trim() || "I could not generate a response.";
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: text,
        agent: newResponse,
      };
      
      const batch = asPracticeBatch(newResponse.practice_batch);
      const single = asPracticeData(newResponse.practice_question) ?? (batch.length === 1 ? batch[0] : null);
      
      chat.setMessages((current) => [...current, assistantMessage]);
      if (batch.length > 1) {
        setBatchCanvasPractice({ batch, messageId: assistantMessage.id });
      } else if (single) {
        setCanvasPractice({
          data: single,
          remainder: "",
          messageId: assistantMessage.id,
        });
      }
      
      return newResponse;
    } catch (caught) {
      handleTurnFailure(caught, {
        userMessageId: userMessage.id,
        assistantId,
        retry: { query: isGradeTap ? (gradedOutcome === "correct" ? "1" : "0") : trimmed, gradedOutcome, studyStage },
      });
      return null;
    } finally {
      chat.setIsReplying(false);
    }
  }

  /**
   * One place decides what a failed turn leaves on screen.
   *
   * If tokens had already streamed we keep them: a student who watched half an
   * explanation appear should not see it vanish. Either way the question stays,
   * so "Retry" can resend it.
   */
  function handleTurnFailure(
    caught: unknown,
    context: {
      userMessageId: string;
      assistantId: string;
      retry: {
        query: string;
        gradedOutcome?: "correct" | "incorrect";
        studyStage?: StudyStage;
        flaggedStepId?: string;
      };
    },
  ) {
    const streamError = caught instanceof AgentStreamError ? caught : null;
    const partial = streamError?.partial.trim() ?? "";

    chat.setError(caught instanceof Error ? caught.message : "Something went wrong.");

    if (partial) {
      chat.setMessages((current) =>
        current.map((message) =>
          message.id === context.assistantId ? { ...message, content: partial } : message,
        ),
      );
    } else {
      chat.setMessages((current) =>
        current.filter((message) => message.id !== context.assistantId),
      );
    }

    setFailedTurn({
      ...context.retry,
      messageIds: partial
        ? [context.userMessageId, context.assistantId]
        : [context.userMessageId],
    });
  }

  /** Drops the failed pair, then resends exactly the same turn. */
  async function retryFailedTurn() {
    if (!failedTurn || chat.isReplying) return;
    const turn = failedTurn;
    setFailedTurn(null);
    chat.setError("");
    chat.setMessages((current) => current.filter((message) => !turn.messageIds.includes(message.id)));
    if (turn.flaggedStepId) {
      await submitFlaggedStep(turn.flaggedStepId);
      return;
    }
    await submitMessage(turn.query, turn.gradedOutcome, turn.studyStage);
  }

  async function submitGrade(outcome: "correct" | "incorrect") {
    chat.setAwaitingGrade(false);
    const agentResponse = await submitMessage(outcome === "correct" ? "1" : "0", outcome);
    if (!agentResponse || !roadmap.isRoadmapSession) return;

    const currentStage = roadmap.contentSequence[roadmap.currentStageIndex];
    if (!currentStage || !["practice", "pyq"].includes(currentStage)) return;

    if (roadmap.currentStageIndex >= roadmap.contentSequence.length - 1) {
      await completeConcept(agentResponse.proficiency_pct ?? roadmap.lastProficiencyPct);
    } else {
      const nextIndex = roadmap.currentStageIndex + 1;
      roadmap.setCurrentStageIndex(nextIndex);
      roadmap.persistRoadmapBind(nextIndex);
    }
  }

  async function submitPickerCard(card: FlashcardItem) {
    if (card.content_id) {
      await submitMessage(`Follow up: select content_id=${card.content_id}`);
      return;
    }
    await submitMessage(`Follow up: ${card.front.slice(0, 80)}`);
  }

  async function submitFlaggedStep(stepId: string) {
    if (chat.isReplying) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: "I don't get this step",
    };

    chat.setError("");
    setFailedTurn(null);
    chat.setIsReplying(true);
    const assistantId = crypto.randomUUID();
    chat.setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant" as const, content: "" },
    ]);

    try {
      const agentResponse = await chat.sendAgentMessage(
        "I don't get this step",
        chat.activeSessionId ?? sessionId,
        { flaggedStepId: stepId },
        (token) => {
          chat.setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      );
      
      chat.setMessages((current) => current.filter((m) => m.id !== assistantId));
      await handleAgentResponse(agentResponse);
      const text = agentResponse.response?.trim() || "I could not generate a response.";
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: text,
        agent: agentResponse,
      };
      chat.setMessages((current) => [...current, assistantMessage]);
    } catch (caught) {
      handleTurnFailure(caught, {
        userMessageId: userMessage.id,
        assistantId,
        retry: { query: "I don't get this step", flaggedStepId: stepId },
      });
    } finally {
      chat.setIsReplying(false);
    }
  }

  const emptyThread = !chat.isLoadingSession && chat.messages.length === 0;

  return (
    <>
      <StudySidebar
        studyContext={{
          conceptName: roadmap.roadmapNode?.concept_name,
          conceptId: roadmap.roadmapConceptId,
          nodeId: roadmap.roadmapNodeId,
          stage: roadmap.isRoadmapSession ? roadmap.contentSequence[roadmap.currentStageIndex] : null,
          stageIndex: roadmap.currentStageIndex,
          stageTotal: roadmap.contentSequence.length,
          proficiencyPct: roadmap.lastProficiencyPct ?? roadmap.roadmapNode?.proficiency_pct ?? null,
          weakPrereq: chat.latestAssistant?.agent?.card?.weak_prereq ?? null,
          journeyType: chat.placementContext.journeyType ?? null,
        }}
      />
    <main className="chat-page">
      {historyOpen ? (
        <button
          type="button"
          className="chat-history-scrim"
          aria-label="Close chat history"
          onClick={() => setHistoryOpen(false)}
        />
      ) : null}
      <aside className={`chat-history ${historyOpen ? "chat-history-open" : ""}`} aria-hidden={!historyOpen}>
        <div className="chat-history-head">
          <p>Chat history</p>
          <button type="button" className="chat-history-close" onClick={() => setHistoryOpen(false)} aria-label="Close history">
            <XIcon />
          </button>
        </div>
        <div className="chat-history-list">
          {chat.visibleSessions.length === 0 ? (
            <p className="chat-history-empty">No past sessions yet.</p>
          ) : (
            chat.visibleSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`chat-history-item ${session.id === chat.activeSessionId ? "chat-history-item-active" : ""}`}
                onClick={() => {
                  chat.selectSession(session.id);
                  setHistoryOpen(false);
                }}
                title={session.title}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </aside>

    <div className="chat-page-layout">
      <section className={`chat-main ${roadmap.isRoadmapSession && roadmap.roadmapNode ? "chat-main--roadmap" : ""}`}>
        <header className="chat-header">
          <div className="chat-header-start">
            <button
              type="button"
              className="chat-history-toggle"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open chat history"
            >
              <HistoryIcon />
            </button>
            <div className="chat-header-copy">
              <h1>{roadmap.roadmapNode?.concept_name || "Study session"}</h1>
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="header-action-button" onClick={() => {}}>
              New chat
            </button>
            {!emptyThread ? (
              <>
                <button
                  type="button"
                  className="end-session"
                  onClick={() => void chat.endSession()}
                  disabled={!chat.activeSessionId || chat.isEndingSession}
                >
                  {chat.isEndingSession ? "Ending..." : "End Session"}
                </button>
                <button
                  type="button"
                  className="concept-toggle"
                  onClick={() => setPanelCollapsed((current) => !current)}
                  aria-label="Toggle concepts panel"
                >
                  {panelCollapsed ? <PanelIcon /> : <XIcon />}
                </button>
              </>
            ) : null}
          </div>
        </header>

        {roadmap.isRoadmapSession && roadmap.roadmapNode && (
          <div className="study-path-bar">
            <StudyStepBar
              stages={roadmap.contentSequence}
              currentStageIndex={roadmap.currentStageIndex}
              conceptName={roadmap.roadmapNode.concept_name}
              loading={chat.isReplying}
              conceptComplete={roadmap.conceptComplete}
              slidesComplete
              requiresSlides={false}
              onAdvance={(stage) => {}}
            />
          </div>
        )}

        <div className={`chat-workspace-body${canvasPractice ? " chat-workspace-body--split" : ""}`}>
          <div className="chat-column">
            <MessageList 
              messages={chat.messages}
              isLoadingSession={chat.isLoadingSession}
              sessionNotFound={chat.sessionNotFound}
              emptyThread={emptyThread}
              isRoadmapSession={roadmap.isRoadmapSession}
              isReplying={chat.isReplying}
              quickPrompts={quickPrompts}
              awaitingGrade={chat.awaitingGrade}
              canvasPractice={canvasPractice}
              latestAssistantId={chat.latestAssistant?.id}
              createSession={() => {}}
              submitMessage={(text) => void submitMessage(text)}
              submitGrade={(outcome) => void submitGrade(outcome)}
              submitPickerCard={(card) => void submitPickerCard(card)}
              setBatchCanvasPractice={setBatchCanvasPractice}
              submitFlaggedStep={(stepId) => void submitFlaggedStep(stepId)}
            />

            <ChatInput 
              submitMessage={(text) => submitMessage(text)}
              sessionNotFound={chat.sessionNotFound}
              isLoadingSession={chat.isLoadingSession}
              isReplying={chat.isReplying}
              showSelfGradeHint={!canvasPractice && (chat.awaitingGrade || Boolean(chat.latestAssistant?.agent?.grading_ui?.show_correct_incorrect))}
              error={chat.error}
              onRetry={failedTurn ? () => void retryFailedTurn() : undefined}
            />
          </div>
          
          {canvasPractice ? (
            <aside className="practice-canvas-pane">
              <InteractivePracticeCanvas
                data={canvasPractice.data}
                remainder={canvasPractice.remainder}
                onGrade={(outcome) => void submitGrade(outcome)}
                gradingDisabled={chat.isReplying}
              />
            </aside>
          ) : null}
        </div>
      </section>
      <AgentRosterPanel
        userId={getSupabaseUserId()}
        sessionId={chat.activeSessionId}
        roadmapConceptId={roadmap.roadmapConceptId}
        primaryConceptId={chat.latestAssistant?.agent?.primary_concept_id ?? roadmap.roadmapConceptId}
        focusChapters={chat.placementContext.focusChapters}
        activeAgent={chat.lastActiveAgent}
        refreshKey={agentRefreshKey}
        collapsed={agentPanelCollapsed}
        onToggle={() => setAgentPanelCollapsed((c) => !c)}
      />
      {batchCanvasPractice && (
        <PracticeBatchCanvas
          batch={batchCanvasPractice.batch}
          onClose={() => setBatchCanvasPractice(null)}
          onSubmitBatch={(results) => void submitMessage("SUBMISSION::" + JSON.stringify(results))}
          isSubmitting={chat.isReplying}
        />
      )}
    </div>
    </main>
    </>
  );
}

/**
 * Scoped boundary around the busiest, most complex surface in the app.
 *
 * A crash in the thread (a malformed presentation payload, a bad practice
 * canvas) used to unmount the whole tree and drop the student back on a blank
 * page with no idea whether the session survived. It did: every turn is
 * persisted server-side, so the message says so and reloading resumes it.
 * `resetKey={sessionId}` clears the caught error when the student navigates to
 * a different session.
 */
export default function ChatWorkspace({ sessionId }: { sessionId: string }) {
  return (
    <ErrorBoundary
      scope="ChatWorkspace"
      resetKey={sessionId}
      title="This study session hit a snag"
      description="Your progress is saved — every turn is stored on the server. Reload to pick the conversation back up."
    >
      <ChatWorkspaceInner sessionId={sessionId} />
    </ErrorBoundary>
  );
}
