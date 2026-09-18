"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { prepareMathMarkdown } from "@/lib/mathHarden";
import InteractivePracticeCanvas from "./InteractivePracticeCanvas";

type MarkdownMathProps = {
  content: string;
  className?: string;
  /** `formula` = residual repair only (agent already $$ wrapped). Default `full`. */
  mode?: "full" | "formula";
};

const KATEX_OPTIONS = {
  throwOnError: false,
  strict: "ignore" as const,
  trust: true,
  output: "htmlAndMathml" as const,
};

function DiagramImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;
  return (
    <span className="markdown-diagram-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || "Diagram"}
        loading="lazy"
        className="markdown-diagram"
        onError={(event) => {
          const el = event.currentTarget;
          el.style.display = "none";
          const wrap = el.parentElement;
          if (wrap && !wrap.querySelector(".markdown-diagram-fallback")) {
            const fallback = document.createElement("p");
            fallback.className = "markdown-diagram-fallback";
            fallback.textContent = "Diagram could not be loaded.";
            wrap.appendChild(fallback);
          }
        }}
      />
    </span>
  );
}

export default function MarkdownMath({
  content,
  className = "markdown-math",
  mode = "full",
}: MarkdownMathProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Preprocess, then let KaTeX itself veto anything it cannot parse, and fall back to
  // conservative preprocessing when the wrapping heuristics would make things worse.
  // A wrong guess is then harmless: the fragment renders as text, never as a red error.
  const normalized = content?.trim() ? prepareMathMarkdown(content, mode) : "";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !normalized) return;
    const errors = root.querySelectorAll(".katex-error");
    if (errors.length === 0) return;
    const sample = errors[0]?.textContent?.slice(0, 120) ?? "";
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[katex] ${errors.length} soft-render error(s) in markdown block`,
        sample ? { sample } : undefined,
      );
    }
  }, [normalized]);

  if (!normalized) return null;

  return (
    <div className={className} ref={rootRef}>
      <ReactMarkdown
        remarkPlugins={[[remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
        urlTransform={(url) => url}
        components={{
          img: ({ src, alt }) => (
            <DiagramImage src={typeof src === "string" ? src : undefined} alt={alt} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-([\w-]+)/.exec(className || "");
            if (!inline && match && match[1] === "interactive-practice") {
              try {
                const data = JSON.parse(String(children).replace(/\n$/, ""));
                return <InteractivePracticeCanvas data={data} />;
              } catch {
                return (
                  <pre className={className} {...props}>
                    <code>{children}</code>
                  </pre>
                );
              }
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
