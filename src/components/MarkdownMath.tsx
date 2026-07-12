"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type MarkdownMathProps = {
  content: string;
  className?: string;
};

export default function MarkdownMath({ content, className = "markdown-math" }: MarkdownMathProps) {
  if (!content?.trim()) return null;

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
