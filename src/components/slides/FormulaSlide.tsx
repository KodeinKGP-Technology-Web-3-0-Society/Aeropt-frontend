"use client";

import MarkdownMath from "@/components/MarkdownMath";

/** Agent already wraps formulae via `_as_katex_block` — residual KaTeX repair only. */
export default function FormulaSlide({ bodyMd }: { bodyMd: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
      <MarkdownMath
        content={bodyMd}
        mode="formula"
        className="markdown-math markdown-math--slide markdown-math--formula"
      />
    </div>
  );
}
