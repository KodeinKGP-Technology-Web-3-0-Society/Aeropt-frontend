"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeKatexSafe from "@/lib/math/rehypeKatexSafe";
import { prepareMathMarkdown } from "@/lib/math/mathHarden";
import InteractivePracticeCanvas from "@/components/practice/InteractivePracticeCanvas";
import { requireAgentApiBase } from "@/lib/api/auth";

/**
 * Tutor diagrams arrive as `diagram:<id>` (compiled TikZ, served as SVG by the
 * agent), so stored replies stay short and survive a change of agent host.
 */
function resolveDiagramSrc(src: string): { url: string; tikz: boolean } {
  const m = /^diagram:([0-9a-f]{20})$/.exec(src);
  if (!m) return { url: src, tikz: false };
  try {
    return { url: `${requireAgentApiBase()}/diagrams/${m[1]}.svg`, tikz: true };
  } catch {
    return { url: "", tikz: true };
  }
}

// TeX sizes text in points; at 1.6x a 10pt label matches the 15-16px body text.
const TIKZ_SCALE = 1.6;

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

// Reserved placeholder domains (RFC 2606) are never a real image: a model that
// invents a diagram URL picks them. Render nothing rather than a broken-image box.
const PLACEHOLDER_HOST = /^https?:\/\/([a-z0-9-]+\.)*example\.(com|org|net)(\/|$)/i;

function DiagramImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src || PLACEHOLDER_HOST.test(src)) return null;
  const { url, tikz } = resolveDiagramSrc(src);
  if (!url) return null;
  return (
    <span className={tikz ? "markdown-diagram-wrap markdown-diagram-wrap--tikz" : "markdown-diagram-wrap"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt || "Diagram"}
        loading="lazy"
        className={tikz ? "markdown-diagram markdown-diagram--tikz" : "markdown-diagram"}
        onLoad={
          tikz
            ? (event) => {
                const el = event.currentTarget;
                if (el.naturalWidth) el.style.width = `${Math.round(el.naturalWidth * TIKZ_SCALE)}px`;
              }
            : undefined
        }
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
      {tikz && alt ? <span className="markdown-diagram-caption">{alt}</span> : null}
    </span>
  );
}

/**
 * Links/images in model output are untrusted. Allow web, mail, tel, relative and in-page
 * URLs plus raster data: images (diagrams); everything else (javascript:, vbscript:, data:text/html, svg data) is dropped.
 */
const SAFE_URL = /^(?:(?:https?|mailto|tel):|data:image\/(?:png|jpe?g|gif|webp);base64,|[/#?.]|[^:]*$)/i;
function safeUrl(url: string): string {
  const u = url.trim().replace(/[\u0000-\u001f\s]+/g, "");
  return SAFE_URL.test(u) ? url : "";
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
        // GFM for the tutor's comparison tables. singleTilde off: "~5 m … ~2 s" is
        // approximation in physics prose, not strikethrough.
        remarkPlugins={[[remarkGfm, { singleTilde: false }], [remarkMath, { singleDollarTextMath: true }]]}
        // rehypeKatexSafe runs after KaTeX and turns any error node into plain code,
        // so a formula the pre-pass mis-split still cannot render as a red blob.
        rehypePlugins={[[rehypeKatex, KATEX_OPTIONS], rehypeKatexSafe]}
        urlTransform={safeUrl}
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
