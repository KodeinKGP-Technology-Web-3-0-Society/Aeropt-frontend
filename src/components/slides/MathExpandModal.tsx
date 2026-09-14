"use client";

import React from "react";
import MarkdownMath from "@/components/MarkdownMath";

export default function MathExpandModal({
  title,
  content,
  onClose,
}: {
  title?: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Expanded content"}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-accent/40 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          {title && <h3 className="text-sm font-bold text-ink">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-hover"
          >
            Close
          </button>
        </div>
        <MarkdownMath content={content} className="markdown-math text-base" />
      </div>
    </div>
  );
}
