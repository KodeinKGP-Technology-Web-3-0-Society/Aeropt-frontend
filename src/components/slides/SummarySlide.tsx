"use client";

import MarkdownMath from "@/components/MarkdownMath";

export default function SummarySlide({ bodyMd }: { bodyMd: string }) {
  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/15 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">Takeaway</p>
      <MarkdownMath content={bodyMd} className="markdown-math markdown-math--slide" />
    </div>
  );
}
