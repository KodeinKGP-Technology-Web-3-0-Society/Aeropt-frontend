import React, { FormEvent, useRef, useState } from "react";

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </svg>
  );
}

interface ChatInputProps {
  submitMessage: (value: string) => Promise<any>;
  sessionNotFound: boolean;
  isLoadingSession: boolean;
  isReplying: boolean;
  showSelfGradeHint: boolean;
  error: string;
  /** Present only when the last turn failed and can be resent as-is. */
  onRetry?: () => void;
}

export default function ChatInput({
  submitMessage,
  sessionNotFound,
  isLoadingSession,
  isReplying,
  showSelfGradeHint,
  error,
  onRetry,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
    setInput("");
  }

  function formatAgentError(raw: string): string {
    const lower = raw.toLowerCase();
    if (
      lower.includes("graphrag") ||
      lower.includes("retriever") ||
      lower.includes("dns") ||
      lower.includes("name or service not known")
    ) {
      return "Couldn't fetch sources — try again.";
    }
    return raw;
  }

  return (
    <form ref={formRef} className="chat-input" onSubmit={onSubmit}>
      <div className="chat-composer">
        <textarea
          aria-label="Ask the tutor a question"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask anything from Laws of Motion, Work Energy & Power, or Rotational Motion..."
          rows={1}
          disabled={sessionNotFound || isLoadingSession}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={sessionNotFound || isReplying || isLoadingSession || !input.trim()}
          aria-label="Send message"
        >
          <ArrowUpIcon />
        </button>
      </div>
      {error && !sessionNotFound ? (
        <p className="chat-error" role="status">
          {formatAgentError(error)}
          {onRetry ? (
            <>
              {" "}
              <button
                type="button"
                onClick={onRetry}
                disabled={isReplying}
                className="font-semibold text-accent underline underline-offset-2 disabled:opacity-60"
              >
                Retry
              </button>
            </>
          ) : null}
        </p>
      ) : showSelfGradeHint ? (
        <p>After practice questions, use the Correct / Incorrect buttons to self-grade.</p>
      ) : null}
    </form>
  );
}
