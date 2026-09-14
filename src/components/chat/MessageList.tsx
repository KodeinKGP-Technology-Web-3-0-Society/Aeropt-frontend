import React, { useEffect, useRef } from "react";
import AssistantResponse from "./AssistantResponse";
import type { Message } from "./types";
import { asPracticeBatch } from "@/lib/practiceContent";
import type { FlashcardItem } from "@/lib/agent";

interface MessageListProps {
  messages: Message[];
  isLoadingSession: boolean;
  sessionNotFound: boolean;
  emptyThread: boolean;
  isRoadmapSession: boolean;
  isReplying: boolean;
  quickPrompts: string[];
  awaitingGrade: boolean;
  canvasPractice: { messageId: string } | null;
  latestAssistantId: string | undefined;
  createSession: () => void;
  submitMessage: (text: string) => void;
  submitGrade: (outcome: "correct" | "incorrect") => void;
  submitPickerCard: (card: FlashcardItem) => void;
  setBatchCanvasPractice: (data: { batch: any; messageId: string }) => void;
  submitFlaggedStep: (stepId: string) => void;
}

export default function MessageList({
  messages,
  isLoadingSession,
  sessionNotFound,
  emptyThread,
  isRoadmapSession,
  isReplying,
  quickPrompts,
  awaitingGrade,
  canvasPractice,
  latestAssistantId,
  createSession,
  submitMessage,
  submitGrade,
  submitPickerCard,
  setBatchCanvasPractice,
  submitFlaggedStep,
}: MessageListProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isReplying]);

  return (
    <div className={`chat-scroll ${emptyThread ? "chat-scroll-empty" : ""}`}>
      <div className="chat-thread">
        {isLoadingSession && messages.length === 0 && !sessionNotFound && (
          <p className="chat-status" role="status">Loading session…</p>
        )}

        {sessionNotFound && (
          <div className="chat-empty">
            <h2>Session not found</h2>
            <p className="chat-status">This chat may have been deleted or belongs to another account.</p>
            <button type="button" className="header-action-button" onClick={createSession}>
              New chat
            </button>
          </div>
        )}

        {emptyThread && !isRoadmapSession && !sessionNotFound && !isLoadingSession && (
          <div className="chat-empty">
            <h2>What do you want to study?</h2>
            <p className="chat-status">Pick a starter or type below.</p>
            <div className="chat-empty-chips">
              <button
                type="button"
                className="quick-prompt-chip"
                onClick={() => void submitMessage("Teach me a short Laws of Motion warm-up from the basics.")}
              >
                Laws of Motion intro
              </button>
              <button
                type="button"
                className="quick-prompt-chip"
                onClick={() =>
                  void submitMessage("Give me a 10-minute mixed JEE drill across Physics, Chemistry and Maths.")
                }
              >
                10-min PCM drill
              </button>
              <button
                type="button"
                className="quick-prompt-chip"
                onClick={() =>
                  void submitMessage("Give me one JEE PYQ and walk me through the solution after I attempt it.")
                }
              >
                One PYQ
              </button>
            </div>
          </div>
        )}

        {isRoadmapSession && isReplying && messages.length === 0 && (
          <p className="chat-status">Loading lesson…</p>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div className="user-bubble" key={message.id}>
              {message.content}
            </div>
          ) : (
            <AssistantResponse
              key={message.id}
              message={message}
              onGrade={(outcome) => void submitGrade(outcome)}
              onPickCard={(card) => void submitPickerCard(card)}
              onOpenBatchCanvas={(batch, msgId) =>
                setBatchCanvasPractice({ batch: asPracticeBatch(batch), messageId: msgId })
              }
              onFlagStep={(stepId) => void submitFlaggedStep(stepId)}
              gradingDisabled={isReplying}
              suppressPicker={isRoadmapSession}
              isLatest={message.id === latestAssistantId}
              pinPractice={Boolean(canvasPractice) && message.id === canvasPractice?.messageId}
            />
          ),
        )}

        {!awaitingGrade && !isRoadmapSession && quickPrompts.length > 0 && !emptyThread && (
          <div className="quick-prompts-row">
            <span className="quick-prompts-label">Try next</span>
            <div className="quick-prompts-chips">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="quick-prompt-chip"
                  onClick={() => void submitMessage(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>
    </div>
  );
}
