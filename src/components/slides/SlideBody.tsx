"use client";

import React from "react";
import DiagramSlide from "@/components/slides/DiagramSlide";
import FormulaSlide from "@/components/slides/FormulaSlide";
import SummarySlide from "@/components/slides/SummarySlide";
import MarkdownMath from "@/components/MarkdownMath";
import { extractMarkdownImageUrls } from "@/lib/math/markdownMath";
import type { SlideType } from "@/components/slides/types";

function stripMarkdownImages(md: string): string {
  return md.replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
}

export default function SlideBody({
  type,
  bodyMd,
  imageUrl,
}: {
  type: SlideType | string;
  bodyMd: string;
  imageUrl?: string | null;
}) {
  const embeddedUrls = extractMarkdownImageUrls(bodyMd);
  const resolvedImage = imageUrl || embeddedUrls[0] || null;
  const textMd = stripMarkdownImages(bodyMd);

  if (type === "formula") {
    return <FormulaSlide bodyMd={textMd || bodyMd} />;
  }

  if (type === "diagram" || resolvedImage) {
    return <DiagramSlide bodyMd={textMd} imageUrl={resolvedImage} />;
  }

  if (type === "summary") {
    return <SummarySlide bodyMd={textMd || bodyMd} />;
  }

  return (
    <MarkdownMath
      content={textMd || bodyMd}
      className="markdown-math markdown-math--slide text-sm leading-relaxed"
    />
  );
}
