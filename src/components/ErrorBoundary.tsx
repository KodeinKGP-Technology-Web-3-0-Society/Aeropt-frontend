"use client";

import React from "react";

type FallbackRender = (context: { error: Error; reset: () => void }) => React.ReactNode;

type ErrorBoundaryProps = {
  children: React.ReactNode;
  /** Shown above the message. Keep it plain — students read this. */
  title?: string;
  /** Reassurance line, e.g. "your progress is saved". */
  description?: string;
  /** Full control over the fallback UI. Takes precedence over title/description. */
  fallback?: FallbackRender;
  /** Label used in the console so we can tell which boundary caught it. */
  scope?: string;
  /** Changing this value clears a caught error (e.g. on route change). */
  resetKey?: unknown;
};

type ErrorBoundaryState = { error: Error | null };

/**
 * The only React error boundary in the app. Everything else composes it.
 *
 * A render crash inside `children` is contained here instead of unmounting the
 * whole tree (React's default when nothing catches), which would leave the
 * student on a white screen with no way back.
 */
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No telemetry service is wired up; the console is the only sink we have.
    console.error(`[ErrorBoundary${this.props.scope ? `:${this.props.scope}` : ""}]`, error, info.componentStack);
  }

  componentDidUpdate(previous: ErrorBoundaryProps) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <div
        role="alert"
        className="flex min-h-[60vh] flex-1 items-center justify-center bg-canvas px-6 py-10"
      >
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-[var(--shadow-card)]">
          <h2 className="mb-2 text-base font-bold text-ink">
            {this.props.title ?? "Something went wrong"}
          </h2>
          <p className="mb-5 text-sm text-muted">
            {this.props.description ??
              "This part of the app stopped responding. Your progress is saved — reloading usually fixes it."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-5 text-xs font-semibold uppercase tracking-wider text-ink"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-xs font-semibold uppercase tracking-wider text-accent-on hover:bg-accent-hover"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
