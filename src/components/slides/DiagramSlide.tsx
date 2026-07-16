"use client";

import { useState } from "react";
import MarkdownMath from "@/components/MarkdownMath";

export default function DiagramSlide({
  bodyMd,
  imageUrl,
}: {
  bodyMd: string;
  imageUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className="space-y-3">
      {showImage ? (
        <div className="markdown-diagram-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl!}
            alt="Diagram"
            loading="lazy"
            className="markdown-diagram"
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <p className="markdown-diagram-fallback">
          {imageUrl
            ? "Diagram could not be loaded — use the description below."
            : "No diagram image for this concept — use the description below."}
        </p>
      )}
      {bodyMd ? (
        <MarkdownMath content={bodyMd} className="markdown-math markdown-math--slide text-sm" />
      ) : (
        <p className="text-sm dark:text-slate-400 text-slate-500">
          Sketch the setup from the problem statement if needed.
        </p>
      )}
    </div>
  );
}
