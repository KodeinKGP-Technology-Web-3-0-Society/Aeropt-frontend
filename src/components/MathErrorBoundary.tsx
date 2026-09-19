"use client";

import React from "react";
import ErrorBoundary from "@/components/ErrorBoundary";

/**
 * Last line of defence for the LaTeX contract.
 *
 * `markdownMath.ts` → `mathHarden.ts` → `rehypeKatexSafe.ts` already guarantee
 * that no KaTeX error node reaches a student; none of that logic is touched
 * here. This only covers the remaining case those layers cannot: a *throw*
 * during render (a malformed AST, an upstream library change) which React
 * would otherwise turn into a white screen for the whole chat thread. When
 * that happens the student still gets the tutor's words, as plain text.
 */
export default function MathErrorBoundary({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      scope="MarkdownMath"
      resetKey={content}
      fallback={() => (
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-hover p-3 text-sm text-ink">
          {content}
        </pre>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
